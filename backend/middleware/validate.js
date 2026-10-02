const { validationResult } = require('express-validator');
const { failure } = require('../utils/apiResponse');
module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return failure(res, 'Validation failed', 422, errors.array());
  next();
};
