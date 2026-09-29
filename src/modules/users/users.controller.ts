import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service.js';

export class UsersController {
  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UsersService.findById(req.user!.id);
      res.json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  }

  static async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UsersService.updateProfile(req.user!.id, req.body);
      res.json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  }
}
