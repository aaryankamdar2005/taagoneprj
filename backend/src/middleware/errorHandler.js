const { error } = require('../utils/response');

// 404 Not Found handler
exports.notFound = (req, res, next) => {
  error(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
};

// Global error handler
exports.errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return error(res, 'Validation failed', 400, errors);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return error(res, `${field} already exists`, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return error(res, 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return error(res, 'Token expired', 401);
  }

  // Cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return error(res, 'Invalid ID format', 400);
  }

  // Default error
  error(res, 
    process.env.NODE_ENV === 'development' ? err.message : 'Internal server error', 
    err.statusCode || 500
  );
};
