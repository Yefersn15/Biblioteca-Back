exports.successResponse = (res, data = null, message = 'OK', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

exports.errorResponse = (res, message = 'Error', statusCode = 400) =>
  res.status(statusCode).json({ success: false, message });
