function success(res, data = null, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, message, data });
}
function failure(res, message = 'Request failed', status = 400, errors = undefined) {
  return res.status(status).json({ success: false, message, ...(errors ? { errors } : {}) });
}
module.exports = { success, failure };
