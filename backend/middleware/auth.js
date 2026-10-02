const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { failure } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return failure(res, 'Authentication required', 401);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.execute('SELECT id, name, email, role, status, phone, profile_image FROM users WHERE id=? LIMIT 1', [decoded.sub]);
    if (!rows[0] || rows[0].status !== 'active') return failure(res, 'Account unavailable', 401);
    req.user = rows[0];
    next();
  } catch (error) {
    return failure(res, 'Invalid or expired token', 401);
  }
});

const authorize = (...roles) => (req, res, next) => roles.includes(req.user?.role) ? next() : failure(res, 'Forbidden', 403);
module.exports = { protect, authorize };
