exports.success = (res, message, data = null) => {
  res.json({
    success: true,
    message,
    data,
    timestamp: new Date()
  });
};

exports.error = (res, message, statusCode = 500) => {
  res.status(statusCode).json({
    success: false,
    message,
    timestamp: new Date()
  });
};
