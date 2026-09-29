const { AppError } = require('../utils/AppError');
const { logger } = require('../utils/logger');
const { env } = require('../config/env');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    logger.warn({ err, requestId: req.requestId }, err.message);
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  logger.error({ err, requestId: req.requestId }, 'Unexpected Error');
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
