import { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/errors/AppError.js';
import { logger } from '../common/utils/logger.js';
import { env } from '../config/env.js';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    logger.warn({ err, requestId: req.requestId }, err.message);
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  logger.error({ err, requestId: req.requestId }, 'Unexpected Error');
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
