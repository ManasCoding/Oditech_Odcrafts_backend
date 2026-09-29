import { Request, Response, NextFunction } from 'express';
import { ProductsService } from './products.service.js';
import {
  ProductStatus,
  SellerProfile,
  SellerStatus,
  User,
  Product,
} from '../../database/models/index.js';
import { UserRole } from '../../database/models/User.model.js';
import { ForbiddenError } from '../../common/errors/AppError.js';

export class ProductsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ProductsService.list({
        search: req.query.q as string,
        category: req.query.category as string,
        craft: req.query.craft as string,
        district: req.query.district as string,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        rating: req.query.rating ? Number(req.query.rating) : undefined,
        isHandmade: req.query.handmade === 'true' ? true : undefined,
        isFeatured: req.query.featured === 'true',
        isBestseller: req.query.bestseller === 'true',
        isNew: req.query.new === 'true',
        inStock: req.query.inStock === 'true',
        sellerId: req.query.artisan as string,
        sort: req.query.sort as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      });
      res.json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductsService.getBySlug(req.params.slug);
      res.json({ status: 'success', data: { product } });
    } catch (error) {
      next(error);
    }
  }

  static async getRelated(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, categoryId, craftId } = req.query;
      const products = await ProductsService.getRelated(
        productId as string,
        categoryId as string,
        craftId as string
      );
      res.json({ status: 'success', data: { products } });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      let seller = await SellerProfile.findOne({ userId: req.user!.id });
      if (!seller) {
        const user = await User.findById(req.user!.id);
        const nameSlug = user?.name
          ? user.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
          : 'artisan';
        const baseSlug = nameSlug || `artisan-${Date.now()}`;
        let slug = baseSlug;
        let count = 1;
        while (await SellerProfile.exists({ slug })) {
          slug = `${baseSlug}-${count++}`;
        }
        seller = await SellerProfile.create({
          userId: req.user!.id,
          slug,
          status: SellerStatus.APPROVED,
          district: req.body.district || 'Bargarh',
          state: 'Odisha',
        });
      }

      // Self-heal any products that might have been saved with userId
      await Product.updateMany(
        { sellerId: req.user!.id },
        { $set: { sellerId: seller._id } }
      );

      const initialStatus =
        req.user!.role === UserRole.ADMIN
          ? req.body.status || ProductStatus.PUBLISHED
          : ProductStatus.SUBMITTED;

      const product = await ProductsService.create(seller._id.toString(), {
        ...req.body,
        status: initialStatus,
      });

      res.status(201).json({ status: 'success', data: { product } });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const isAdmin = req.user!.role === UserRole.ADMIN;
      const seller = await SellerProfile.findOne({ userId: req.user!.id });
      const allowedIds = [req.user!.id];
      if (seller) allowedIds.push(seller._id.toString());
      const product = await ProductsService.update(req.params.id, allowedIds, isAdmin, req.body);
      res.json({ status: 'success', data: { product } });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const isAdmin = req.user!.role === UserRole.ADMIN;
      const seller = await SellerProfile.findOne({ userId: req.user!.id });
      const allowedIds = [req.user!.id];
      if (seller) allowedIds.push(seller._id.toString());
      await ProductsService.softDelete(req.params.id, allowedIds, isAdmin);
      res.json({ status: 'success', message: 'Product deleted' });
    } catch (error) {
      next(error);
    }
  }

  static async setStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user!.role !== UserRole.ADMIN) throw new ForbiddenError('Admin only');
      const { status, adminNotes } = req.body;
      const product = await ProductsService.setStatus(req.params.id, status as ProductStatus, adminNotes);
      res.json({ status: 'success', data: { product } });
    } catch (error) {
      next(error);
    }
  }
}
