import { Request, Response, NextFunction } from 'express';
import { CategoriesService } from './categories.service.js';

export class CategoriesController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.all === 'true' && req.user?.role === 'ADMIN';
      const categories = await CategoriesService.getAll(includeInactive);
      res.json({ status: 'success', data: { categories } });
    } catch (error) {
      next(error);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CategoriesService.getBySlug(req.params.slug);
      res.json({ status: 'success', data: { category } });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CategoriesService.create(req.body);
      res.status(201).json({ status: 'success', data: { category } });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CategoriesService.update(req.params.id, req.body);
      res.json({ status: 'success', data: { category } });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await CategoriesService.delete(req.params.id);
      res.json({ status: 'success', message: 'Category disabled' });
    } catch (error) {
      next(error);
    }
  }
}
