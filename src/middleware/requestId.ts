import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const id = uuidv4();
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
};
