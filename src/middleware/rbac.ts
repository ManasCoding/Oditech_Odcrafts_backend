import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../common/errors/AppError.js';
import { UserRole } from '../database/models/index.js';

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role as UserRole)) {
      throw new ForbiddenError('You do not have permission to perform this action');
    }
    next();
  };
};

export const requireAdmin = requireRole(UserRole.ADMIN);
export const requireSeller = requireRole(UserRole.SELLER, UserRole.ADMIN);
export const requireCustomer = requireRole(UserRole.CUSTOMER, UserRole.ADMIN);
