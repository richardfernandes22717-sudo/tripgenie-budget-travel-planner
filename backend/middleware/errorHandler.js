const { failure } = require('../utils/apiResponse');
function notFound(req, res) { return failure(res, `Route not found: ${req.method} ${req.originalUrl}`, 404); }
function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.code === 'ER_DUP_ENTRY') return failure(res, 'A record with the same unique value already exists', 409);
  if (err.code === 'ER_NO_REFERENCED_ROW_2') return failure(res, 'Referenced record does not exist', 400);
  if (err.name === 'MulterError') return failure(res, err.message, 400);
  const status = err.statusCode || 500;
  return failure(res, status === 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message, status);
}
module.exports = { notFound, errorHandler };
