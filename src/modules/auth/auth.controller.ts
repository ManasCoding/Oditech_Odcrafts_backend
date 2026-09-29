import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import type { RegisterInput, LoginInput } from './auth.dto.js';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body as RegisterInput;
      const result = await AuthService.register(data);
      res.status(201).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body as LoginInput;
      const result = await AuthService.login(data);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshToken(refreshToken);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const user = await AuthService.getMe(userId);
      res.status(200).json({ status: 'success', data: { user } });
    } catch (error) {
      next(error);
    }
  }

  static logout(_req: Request, res: Response) {
    // JWT is stateless — client deletes token
    // If we add refresh token blocklist later, handle it here
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  }
}
