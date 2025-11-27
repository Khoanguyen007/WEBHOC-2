const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = error.statusCode || 500;

  // Log error with context
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode: error.statusCode,
    message: error.message,
    type: err.name
  };
  
  if (process.env.NODE_ENV !== 'test') {
    console.error('[ERROR]', JSON.stringify(errorLog));
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error.statusCode = 404;
    error.message = 'Resource not found';
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    error.statusCode = 400;
    const field = Object.keys(err.keyPattern)[0];
    error.message = `${field} already exists. Please use a different value.`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error.statusCode = 400;
    const messages = Object.values(err.errors).map(val => val.message);
    error.message = messages.join(', ');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.statusCode = 401;
    error.message = 'Invalid or expired token';
  }

  if (err.name === 'TokenExpiredError') {
    error.statusCode = 401;
    error.message = 'Token has expired';
  }

  // Handle custom AppError or similar
  if (err.isOperational) {
    error.statusCode = err.statusCode;
    error.message = err.message;
  }

  // Generic error handling
  if (!error.statusCode) {
    error.statusCode = 500;
    error.message = 'Internal server error';
  }

  // Send response
  res.status(error.statusCode).json({
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    error: process.env.NODE_ENV === 'development' ? {
      stack: err.stack,
      originalError: err.message
    } : undefined
  });
};

module.exports = errorHandler;