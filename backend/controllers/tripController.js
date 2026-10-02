const { pool } = require('../config/db');
const { success, failure } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { money } = require('../utils/budget');

async function loadTrip(id, user) {
  const [trips] = await pool.execute(
    `SELECT t.*, d.name destination_name, d.image destination_image,
            h.name selected_hotel_name, h.image selected_hotel_image,
            h.price_per_night selected_hotel_price
       FROM trips t
       JOIN destinations d ON d.id=t.destination_id
       LEFT JOIN hotels h ON h.id=t.selected_hotel_id
      WHERE t.id=? AND (t.user_id=? OR ?='admin')`,
    [id, user.id, user.role]
  );
  if (!trips[0]) return null;
  const [days] = await pool.execute('SELECT * FROM trip_days WHERE trip_id=? ORDER BY day_number', [id]);
  for (const day of days) {
    const [items] = await pool.execute('SELECT * FROM itinerary_items WHERE trip_day_id=? ORDER BY start_time, sort_order', [day.id]);
    day.items = items;
  }
  const [budgets] = await pool.execute('SELECT * FROM trip_budgets WHERE trip_id=?', [id]);
  return { ...trips[0], days, budget: budgets[0] || null };
}

async function ownedTrip(conn, tripId, userId) {
  const [rows] = await conn.execute('SELECT * FROM trips WHERE id=? AND user_id=? FOR UPDATE', [tripId, userId]);
  return rows[0] || null;
}

async function recalculateSavedTrip(conn, trip) {
  const [budgetRows] = await conn.execute('SELECT * FROM trip_budgets WHERE trip_id=? FOR UPDATE', [trip.id]);
  const budget = budgetRows[0];
  if (!budget) throw Object.assign(new Error('Trip budget record not found'), { statusCode: 404 });

  const [sums] = await conn.execute(
    `SELECT
       COALESCE(SUM(CASE WHEN i.item_type='restaurant' THEN i.estimated_cost ELSE 0 END),0) restaurant_sum,
       COALESCE(SUM(CASE WHEN i.item_type='attraction' THEN i.estimated_cost ELSE 0 END),0) attraction_sum,
       COALESCE(SUM(CASE WHEN i.item_type='transportation' THEN i.estimated_cost ELSE 0 END),0) transport_sum,
       COALESCE(SUM(CASE WHEN i.item_type='activity' THEN i.estimated_cost ELSE 0 END),0) activity_sum
     FROM itinerary_items i
     JOIN trip_days d ON d.id=i.trip_day_id
     WHERE d.trip_id=?`,
    [trip.id]
  );
  const perPerson = sums[0];
  const travellers = Number(trip.traveller_count);
  const food = money(Number(perPerson.restaurant_sum) * travellers);
  const attraction = money(Number(perPerson.attraction_sum) * travellers);
  const activity = money(Number(perPerson.activity_sum) * travellers);
  const transport = Number(perPerson.transport_sum) > 0
    ? money(Number(perPerson.transport_sum) * travellers)
    : Number(budget.transport_cost);
  const accommodation = Number(budget.accommodation_cost);
  const miscellaneous = Number(budget.miscellaneous_cost);
  const oldBase = Math.max(0, Number(budget.total_cost) - Number(budget.contingency_cost));
  const contingencyRate = oldBase > 0 ? Number(budget.contingency_cost) / oldBase : 0;
  const base = money(accommodation + food + attraction + transport + activity + miscellaneous);
  const contingency = money(base * contingencyRate);
  const total = money(base + contingency);
  const planned = Number(budget.planned_budget);
  const remaining = money(planned - total);
  const [[dayCount]] = await conn.execute('SELECT GREATEST(COUNT(*),1) days FROM trip_days WHERE trip_id=?', [trip.id]);

  await conn.execute(
    `UPDATE trip_budgets SET food_cost=?, attraction_cost=?, transport_cost=?, activity_cost=?,
      contingency_cost=?, total_cost=?, remaining_amount=?, per_person_cost=?, per_day_cost=?, percentage_used=?
      WHERE trip_id=?`,
    [food, attraction, transport, activity, contingency, total, remaining, money(total / travellers), money(total / Number(dayCount.days)), planned ? money(total / planned * 100) : 0, trip.id]
  );
  await conn.execute('UPDATE trips SET estimated_cost=?, remaining_budget=? WHERE id=?', [total, remaining, trip.id]);
  await conn.execute(
    `UPDATE trip_days d SET daily_total=(SELECT COALESCE(SUM(i.estimated_cost),0) * ? FROM itinerary_items i WHERE i.trip_day_id=d.id)
     WHERE d.trip_id=?`,
    [travellers, trip.id]
  );
}

const save = asyncHandler(async (req, res) => {
  const p = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.execute(
      `INSERT INTO trips (user_id,title,origin,destination_id,start_date,end_date,traveller_count,total_budget,estimated_cost,remaining_budget,currency,status,ai_summary,selected_hotel_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [req.user.id, p.title, p.origin, p.destination.id, p.startDate, p.endDate, p.travellers, p.budget.planned, p.budget.total, p.budget.remaining, p.currency || 'INR', 'planned', p.ai?.explanation || null, p.hotel?.id || null]
    );
    for (const day of p.itinerary || []) {
      const dailyTotal = (day.items || []).reduce((sum, item) => sum + Number(item.itemCost || 0) * Number(p.travellers || 1), 0);
      const [dr] = await conn.execute(
        'INSERT INTO trip_days (trip_id,day_number,trip_date,title,daily_total) VALUES (?,?,?,?,?)',
        [r.insertId, day.dayNumber, day.date, day.title, dailyTotal]
      );
      for (const [index, item] of (day.items || []).entries()) {
        await conn.execute(
          `INSERT INTO itinerary_items (trip_day_id,item_type,related_record_id,title,location,start_time,end_time,travel_minutes,estimated_cost,notes,sort_order)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
          [dr.insertId, item.type, item.recordId, item.title, item.location, item.startTime, item.endTime, item.travelMinutes, item.itemCost, item.notes, index]
        );
      }
    }
    const b = p.budget;
    await conn.execute(
      `INSERT INTO trip_budgets (trip_id,accommodation_cost,food_cost,attraction_cost,transport_cost,activity_cost,miscellaneous_cost,contingency_cost,total_cost,planned_budget,remaining_amount,per_person_cost,per_day_cost,percentage_used)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [r.insertId, b.accommodation, b.food, b.attractions, b.transport, b.activities, b.miscellaneous, b.contingency, b.total, b.planned, b.remaining, b.perPerson, b.perDay, b.percentageUsed]
    );
    await conn.commit();
    return success(res, await loadTrip(r.insertId, req.user), 'Trip saved', 201);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
});

const list = asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT t.*, d.name destination_name, d.image destination_image
       FROM trips t JOIN destinations d ON d.id=t.destination_id
      WHERE t.user_id=? ORDER BY t.created_at DESC`,
    [req.user.id]
  );
  return success(res, rows);
});

const detail = asyncHandler(async (req, res) => {
  const trip = await loadTrip(req.params.id, req.user);
  return trip ? success(res, trip) : failure(res, 'Trip not found', 404);
});

const update = asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const trip = await ownedTrip(conn, req.params.id, req.user.id);
    if (!trip) { await conn.rollback(); return failure(res, 'Trip not found', 404); }
    const allowed = ['title', 'start_date', 'end_date', 'traveller_count', 'status'];
    const sets = [];
    const values = [];
    for (const key of allowed) {
      if (req.body[key] !== undefined) { sets.push(`${key}=?`); values.push(req.body[key]); trip[key] = req.body[key]; }
    }
    if (!sets.length) { await conn.rollback(); return failure(res, 'No editable fields supplied', 400); }
    if (String(trip.end_date) < String(trip.start_date)) { await conn.rollback(); return failure(res, 'End date cannot be before start date', 422); }
    values.push(trip.id);
    await conn.execute(`UPDATE trips SET ${sets.join(',')} WHERE id=?`, values);
    if (req.body.start_date !== undefined) {
      await conn.execute('UPDATE trip_days SET trip_date=DATE_ADD(?, INTERVAL (day_number - 1) DAY) WHERE trip_id=?', [trip.start_date, trip.id]);
    }
    if (trip.selected_hotel_id && (req.body.traveller_count !== undefined || req.body.start_date !== undefined || req.body.end_date !== undefined)) {
      const [hotels] = await conn.execute('SELECT price_per_night,maximum_guests FROM hotels WHERE id=?', [trip.selected_hotel_id]);
      if (hotels[0]) {
        const [[dateInfo]] = await conn.execute('SELECT GREATEST(DATEDIFF(?,?),1) nights', [trip.end_date, trip.start_date]);
        const rooms = Math.max(1, Math.ceil(Number(trip.traveller_count) / Number(hotels[0].maximum_guests || 2)));
        await conn.execute('UPDATE trip_budgets SET accommodation_cost=? WHERE trip_id=?', [money(Number(hotels[0].price_per_night) * Number(dateInfo.nights) * rooms), trip.id]);
      }
    }
    await recalculateSavedTrip(conn, trip);
    await conn.commit();
    return success(res, await loadTrip(trip.id, req.user), 'Trip updated');
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally { conn.release(); }
});

const editItem = asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const trip = await ownedTrip(conn, req.params.id, req.user.id);
    if (!trip) { await conn.rollback(); return failure(res, 'Trip not found', 404); }
    const [items] = await conn.execute(
      `SELECT i.* FROM itinerary_items i JOIN trip_days d ON d.id=i.trip_day_id
       WHERE i.id=? AND d.trip_id=? FOR UPDATE`,
      [req.params.itemId, trip.id]
    );
    const item = items[0];
    if (!item) { await conn.rollback(); return failure(res, 'Itinerary item not found', 404); }
    const start = req.body.start_time ?? item.start_time;
    const end = req.body.end_time ?? item.end_time;
    if (start && end && start >= end) { await conn.rollback(); return failure(res, 'End time must be after start time', 422); }
    if (start && end) {
      const [overlaps] = await conn.execute(
        `SELECT id FROM itinerary_items WHERE trip_day_id=? AND id<>? AND start_time IS NOT NULL AND end_time IS NOT NULL
         AND NOT (end_time<=? OR start_time>=?) LIMIT 1`,
        [item.trip_day_id, item.id, start, end]
      );
      if (overlaps[0]) { await conn.rollback(); return failure(res, 'The edited time overlaps another itinerary item', 409); }
    }
    const allowed = ['title', 'location', 'start_time', 'end_time', 'travel_minutes', 'estimated_cost', 'notes'];
    const sets = [];
    const values = [];
    for (const key of allowed) if (req.body[key] !== undefined) { sets.push(`${key}=?`); values.push(req.body[key]); }
    if (!sets.length) { await conn.rollback(); return failure(res, 'No editable item fields supplied', 400); }
    values.push(item.id);
    await conn.execute(`UPDATE itinerary_items SET ${sets.join(',')} WHERE id=?`, values);
    await recalculateSavedTrip(conn, trip);
    await conn.commit();
    return success(res, await loadTrip(trip.id, req.user), 'Itinerary item updated');
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally { conn.release(); }
});

const replaceItem = asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const trip = await ownedTrip(conn, req.params.id, req.user.id);
    if (!trip) { await conn.rollback(); return failure(res, 'Trip not found', 404); }
    const [items] = await conn.execute(
      `SELECT i.* FROM itinerary_items i JOIN trip_days d ON d.id=i.trip_day_id
       WHERE i.id=? AND d.trip_id=? FOR UPDATE`,
      [req.params.itemId, trip.id]
    );
    const item = items[0];
    if (!item || !['restaurant', 'attraction'].includes(item.item_type)) {
      await conn.rollback();
      return failure(res, 'Only restaurant and attraction items can be replaced here', 400);
    }
    const table = item.item_type === 'restaurant' ? 'restaurants' : 'attractions';
    const costField = item.item_type === 'restaurant' ? 'average_cost_per_person' : 'entry_fee';
    const [records] = await conn.execute(
      `SELECT id,name,description,location,${costField} cost FROM ${table}
       WHERE id=? AND destination_id=? AND status='active' LIMIT 1`,
      [req.body.recordId, trip.destination_id]
    );
    const record = records[0];
    if (!record) { await conn.rollback(); return failure(res, 'Replacement record is unavailable for this destination', 404); }
    await conn.execute(
      `UPDATE itinerary_items SET related_record_id=?,title=?,location=?,estimated_cost=?,notes=? WHERE id=?`,
      [record.id, record.name, record.location, record.cost, record.description, item.id]
    );
    await recalculateSavedTrip(conn, trip);
    await conn.commit();
    return success(res, await loadTrip(trip.id, req.user), `${item.item_type} replaced`);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally { conn.release(); }
});

const replaceHotel = asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const trip = await ownedTrip(conn, req.params.id, req.user.id);
    if (!trip) { await conn.rollback(); return failure(res, 'Trip not found', 404); }
    const [hotels] = await conn.execute(
      `SELECT * FROM hotels WHERE id=? AND destination_id=? AND availability_status IN ('available','limited') LIMIT 1`,
      [req.body.hotelId, trip.destination_id]
    );
    const hotel = hotels[0];
    if (!hotel) { await conn.rollback(); return failure(res, 'Hotel is unavailable for this destination', 404); }
    const [[dateInfo]] = await conn.execute('SELECT GREATEST(DATEDIFF(end_date,start_date),1) nights FROM trips WHERE id=?', [trip.id]);
    const rooms = Math.max(1, Math.ceil(Number(trip.traveller_count) / Number(hotel.maximum_guests || 2)));
    const accommodation = money(Number(hotel.price_per_night) * Number(dateInfo.nights) * rooms);
    await conn.execute('UPDATE trips SET selected_hotel_id=? WHERE id=?', [hotel.id, trip.id]);
    await conn.execute('UPDATE trip_budgets SET accommodation_cost=? WHERE trip_id=?', [accommodation, trip.id]);
    trip.selected_hotel_id = hotel.id;
    await recalculateSavedTrip(conn, trip);
    await conn.commit();
    return success(res, await loadTrip(trip.id, req.user), 'Hotel replaced');
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally { conn.release(); }
});

const remove = asyncHandler(async (req, res) => {
  const [result] = await pool.execute('DELETE FROM trips WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  return result.affectedRows ? success(res, null, 'Trip deleted') : failure(res, 'Trip not found', 404);
});

module.exports = { save, list, detail, update, editItem, replaceItem, replaceHotel, remove };
