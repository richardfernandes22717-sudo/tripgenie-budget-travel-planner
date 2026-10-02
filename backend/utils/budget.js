function money(value) { return Math.round((Number(value) + Number.EPSILON) * 100) / 100; }
function calculateRooms(travellers, maxGuests = 2) { return Math.max(1, Math.ceil(travellers / Math.max(1, maxGuests))); }
function calculateBudget({ hotel, restaurants = [], attractions = [], transport = [], activities = [], travellers, days, nights, contingencyPercent = 5, miscellaneous = 0 }) {
  const rooms = calculateRooms(travellers, hotel?.maximum_guests || 2);
  const accommodation = money((hotel?.price_per_night || 0) * nights * rooms);
  const restaurantDaily = restaurants.length
    ? restaurants.reduce((sum, r) => sum + Number(r.average_cost_per_person || 0), 0)
    : 0;
  const food = money(restaurantDaily * travellers * days);
  const attractionCost = money(attractions.reduce((sum, a) => sum + Number(a.entry_fee || 0), 0) * travellers);
  const transportCost = money(transport.reduce((sum, t) => sum + Number(t.estimated_cost || 0), 0) * travellers);
  const activityCost = money(activities.reduce((sum, a) => sum + Number(a.cost || 0), 0) * travellers);
  const base = money(accommodation + food + attractionCost + transportCost + activityCost + Number(miscellaneous || 0));
  const contingency = money(base * Number(contingencyPercent || 0) / 100);
  const total = money(base + contingency);
  return { rooms, accommodation, food, attractions: attractionCost, transport: transportCost, activities: activityCost, miscellaneous: money(miscellaneous), contingency, contingencyPercent: Number(contingencyPercent), total, perPerson: money(total / travellers), perDay: money(total / days) };
}
module.exports = { money, calculateRooms, calculateBudget };
