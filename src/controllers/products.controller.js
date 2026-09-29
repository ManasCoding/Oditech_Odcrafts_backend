const ProductsService = require('../services/products.service');

class ProductsController {
  static async list(req, res, next) {
    try {
      const result = await ProductsService.list(req.query);
      res.json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getBySlug(req, res, next) {
    try {
      const product = await ProductsService.getBySlug(req.params.slug);
      res.json({ status: 'success', data: { product } });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const product = await ProductsService.create(req.user.id, req.body);
      res.status(201).json({ status: 'success', data: { product } });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const isAdmin = req.user.role === 'ADMIN';
      const product = await ProductsService.update(req.params.id, req.user.id, isAdmin, req.body);
      res.json({ status: 'success', data: { product } });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const isAdmin = req.user.role === 'ADMIN';
      await ProductsService.softDelete(req.params.id, req.user.id, isAdmin);
      res.json({ status: 'success', message: 'Product deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { ProductsController };
