const CategoriesService = require('../services/categories.service');

class CategoriesController {
  static async getAll(req, res, next) {
    try {
      const includeInactive = req.query.all === 'true' && req.user?.role === 'ADMIN';
      const categories = await CategoriesService.getAll(includeInactive);
      res.json({ status: 'success', data: { categories } });
    } catch (error) {
      next(error);
    }
  }

  static async getBySlug(req, res, next) {
    try {
      const category = await CategoriesService.getBySlug(req.params.slug);
      res.json({ status: 'success', data: { category } });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const category = await CategoriesService.create(req.body);
      res.status(201).json({ status: 'success', data: { category } });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const category = await CategoriesService.update(req.params.id, req.body);
      res.json({ status: 'success', data: { category } });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      await CategoriesService.remove(req.params.id);
      res.json({ status: 'success', message: 'Category disabled' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { CategoriesController };
