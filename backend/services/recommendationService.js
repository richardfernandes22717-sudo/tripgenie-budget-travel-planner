const { pool } = require('../config/db');
const { calculateBudget, money } = require('../utils/budget');
const { callGroq } = require('./groqService');

function csv(value) { return Array.isArray(value) ? value : String(value || '').split(',').map(x => x.trim()).filter(Boolean); }
function interleave(items, count) { return Array.from({ length: count }, (_, i) => items[i % Math.max(1, items.length)]).filter(Boolean); }

async function shortlist(input) {
  const destinationId = Number(input.destinationId);
  const travellers = Number(input.travellers || 1);
  const days = Math.max(1, Number(input.days || 1));
  const nights = Math.max(1, days - 1 || 1);
  const accommodationBudget = Number(input.accommodationBudget || Number(input.totalBudget || 0) * .35);
  const maxNightly = accommodationBudget / nights / Math.max(1, Math.ceil(travellers / 2));
  const interests = csv(input.interests);
  const cuisines = csv(input.cuisines);
  const dietary = csv(input.dietaryRequirements);
  const [destinations] = await pool.execute('SELECT * FROM destinations WHERE id=? AND status="active"', [destinationId]);
  if (!destinations[0]) throw Object.assign(new Error('Destination not found'), { statusCode: 404 });
  const [hotels] = await pool.execute(`SELECT * FROM hotels WHERE destination_id=? AND availability_status='available' ORDER BY (price_per_night <= ?) DESC, rating DESC, price_per_night ASC LIMIT 12`, [destinationId, maxNightly]);
  const [restaurants] = await pool.execute(`SELECT * FROM restaurants WHERE destination_id=? AND status='active' ORDER BY rating DESC, average_cost_per_person ASC LIMIT 18`, [destinationId]);
  const [attractions] = await pool.execute(`SELECT * FROM attractions WHERE destination_id=? AND status='active' ORDER BY (entry_fee=0) DESC, rating DESC, entry_fee ASC LIMIT 24`, [destinationId]);
  const [transportation] = await pool.execute(`SELECT * FROM transportation WHERE destination_id=? AND status='active' AND (origin=? OR origin='Any') ORDER BY estimated_cost ASC LIMIT 8`, [destinationId, input.origin || 'Any']);
  const filterText = (record, keys, wanted) => !wanted.length || wanted.some(term => keys.some(key => String(record[key] || '').toLowerCase().includes(term.toLowerCase())));
  return {
    destination: destinations[0],
    hotels,
    restaurants: restaurants.filter(r => filterText(r, ['cuisine','dietary_options','description'], [...cuisines, ...dietary])).concat(restaurants).filter((r,i,a)=>a.findIndex(x=>x.id===r.id)===i).slice(0,18),
    attractions: attractions.filter(a => filterText(a, ['category','description'], interests)).concat(attractions).filter((r,i,a)=>a.findIndex(x=>x.id===r.id)===i).slice(0,24),
    transportation
  };
}

function deterministicSelection(records, input) {
  const totalBudget = Number(input.totalBudget || 0);
  const hotel = records.hotels.find(h => Number(h.price_per_night) * Math.max(1, Number(input.days)-1) * Math.ceil(Number(input.travellers)/Number(h.maximum_guests || 2)) <= totalBudget * .4) || records.hotels[records.hotels.length - 1];
  const restaurantIds = records.restaurants.slice(0, Math.min(records.restaurants.length, Number(input.days) * 3)).map(x => x.id);
  const attractionIds = records.attractions.slice(0, Math.min(records.attractions.length, Number(input.days) * 3)).map(x => x.id);
  const transportationIds = records.transportation.slice(0, 2).map(x => x.id);
  return { hotelId: hotel?.id || null, restaurantIds, attractionIds, transportationIds, explanation: 'Database-ranked fallback selected options matching budget, rating, interests and cost.', tips: ['Keep a contingency reserve.', 'Confirm opening hours before departure.', 'Use local transport passes where available.'], source: 'fallback' };
}

async function choose(records, input) {
  const allowed = {
    hotels: new Set(records.hotels.map(x=>x.id)), restaurants: new Set(records.restaurants.map(x=>x.id)), attractions: new Set(records.attractions.map(x=>x.id)), transportation: new Set(records.transportation.map(x=>x.id))
  };
  const system = `You are TripGenie selection engine. Select ONLY database IDs supplied by the user. Return valid JSON with hotelId, restaurantIds, attractionIds, transportationIds, explanation, tips. Never calculate totals. Prefer realistic timing, dietary fit and budget value.`;
  try {
    const selected = await callGroq({ system, user: { request: input, candidates: records }, allowed });
    const fallback = deterministicSelection(records, input);
    return {
      hotelId: selected.hotelId || fallback.hotelId,
      restaurantIds: selected.restaurantIds.length ? selected.restaurantIds : fallback.restaurantIds,
      attractionIds: selected.attractionIds.length ? selected.attractionIds : fallback.attractionIds,
      transportationIds: selected.transportationIds.length ? selected.transportationIds : fallback.transportationIds,
      explanation: selected.explanation || fallback.explanation,
      tips: selected.tips.length ? selected.tips : fallback.tips,
      source: 'groq'
    };
  } catch (error) {
    console.warn('Groq fallback:', error.message);
    return deterministicSelection(records, input);
  }
}

function buildDays({ restaurants, attractions, days, startDate }) {
  const selectedRestaurants = interleave(restaurants, days * 3);
  const selectedAttractions = interleave(attractions, days * 3);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(`${startDate}T00:00:00`); date.setDate(date.getDate()+index);
    const rs = selectedRestaurants.slice(index*3, index*3+3);
    const ats = selectedAttractions.slice(index*3, index*3+3);
    const items = [
      { slot:'Breakfast', startTime:'08:00', endTime:'09:00', type:'restaurant', record:rs[0] },
      { slot:'Morning', startTime:'09:30', endTime:'12:00', type:'attraction', record:ats[0] },
      { slot:'Lunch', startTime:'12:30', endTime:'13:30', type:'restaurant', record:rs[1] },
      { slot:'Afternoon', startTime:'14:00', endTime:'16:30', type:'attraction', record:ats[1] },
      { slot:'Evening', startTime:'17:00', endTime:'19:00', type:'attraction', record:ats[2] },
      { slot:'Dinner', startTime:'19:30', endTime:'20:30', type:'restaurant', record:rs[2] }
    ].filter(x=>x.record).map(x=>({ ...x, recordId:x.record.id, title:x.record.name, location:x.record.location, itemCost:x.type==='restaurant'?Number(x.record.average_cost_per_person):Number(x.record.entry_fee), travelMinutes:30, notes:x.record.description }));
    return { dayNumber:index+1, date:date.toISOString().slice(0,10), title:`Day ${index+1} · ${ats[0]?.category || 'Explore'}`, items };
  });
}

async function generatePlan(input) {
  const days = Math.max(1, Number(input.days || 1));
  const travellers = Math.max(1, Number(input.travellers || 1));
  const records = await shortlist({ ...input, days, travellers });
  const selection = await choose(records, { ...input, days, travellers });
  const hotel = records.hotels.find(x=>x.id===selection.hotelId) || records.hotels[0];
  const restaurants = selection.restaurantIds.map(id=>records.restaurants.find(x=>x.id===id)).filter(Boolean);
  const attractions = selection.attractionIds.map(id=>records.attractions.find(x=>x.id===id)).filter(Boolean);
  const transportation = selection.transportationIds.map(id=>records.transportation.find(x=>x.id===id)).filter(Boolean);
  const budget = calculateBudget({ hotel, restaurants: interleave(restaurants, 3).slice(0,3), attractions: interleave(attractions,days*3).slice(0,days*3), transport: transportation, travellers, days, nights:Math.max(1,days-1), contingencyPercent:Number(input.contingencyPercent || 5), miscellaneous:Number(input.miscellaneous || 0) });
  const totalBudget = Number(input.totalBudget || 0);
  const overBy = money(Math.max(0, budget.total-totalBudget));
  const daysPlan = buildDays({ restaurants, attractions, days, startDate:input.startDate });
  return {
    title: input.title || `${records.destination.name} Smart Escape`, origin:input.origin, destination:records.destination, startDate:input.startDate, endDate:input.endDate, travellers, days,
    hotel, hotelChoices: records.hotels.slice(0,3), restaurants, attractions, transportation, itinerary:daysPlan,
    budget:{ ...budget, planned:totalBudget, remaining:money(totalBudget-budget.total), percentageUsed:totalBudget?money(budget.total/totalBudget*100):0, overBudget:budget.total>totalBudget, overBy, minimumRequiredBudget:budget.total },
    ai:{ source:selection.source, explanation:selection.explanation, tips:selection.tips }
  };
}

module.exports = { shortlist, generatePlan, deterministicSelection };
