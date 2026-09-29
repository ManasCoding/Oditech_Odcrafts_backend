import mongoose from 'mongoose';
import { Product, Category, Craft, ProductStatus, type IProduct } from '../../database/models/index.js';
import { NotFoundError, ForbiddenError } from '../../common/errors/AppError.js';
import slugify from 'slugify';
import { nanoid } from 'nanoid';

export interface ProductFilters {
  search?: string;
  category?: string;
  craft?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  isHandmade?: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
  inStock?: boolean;
  sellerId?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export class ProductsService {
  // ─── List Products (public) ───────────────────────────────────────────────

  static async list(filters: ProductFilters) {
    const {
      search,
      category,
      craft,
      district,
      minPrice,
      maxPrice,
      rating,
      isHandmade,
      isFeatured,
      isBestseller,
      isNew,
      inStock,
      sellerId,
      sort = 'recommended',
      page = 1,
      limit = 20,
    } = filters;

    const query: any = {
      status: ProductStatus.PUBLISHED,
      deletedAt: null,
    };

    if (search) {
      query.$text = { $search: search };
    }
    if (category) {
      if (mongoose.isValidObjectId(category)) {
        query.categoryId = category;
      } else {
        const categoryDoc = await Category.findOne({ slug: category });
        if (categoryDoc) {
          if (category === 'handloom') {
            const sareesDoc = await Category.findOne({ slug: 'sarees' });
            query.categoryId = sareesDoc ? { $in: [categoryDoc._id, sareesDoc._id] } : categoryDoc._id;
          } else {
            query.categoryId = categoryDoc._id;
          }
        } else {
          const craftDoc = await Craft.findOne({ slug: category });
          if (craftDoc) {
            query.craftId = craftDoc._id;
          } else {
            query.categoryId = new mongoose.Types.ObjectId();
          }
        }
      }
    }

    if (craft) {
      if (mongoose.isValidObjectId(craft)) {
        query.craftId = craft;
      } else {
        const craftDoc = await Craft.findOne({ slug: craft });
        if (craftDoc) {
          query.craftId = craftDoc._id;
        } else {
          const catDoc = await Category.findOne({ slug: craft });
          if (catDoc) {
            query.categoryId = catDoc._id;
          } else {
            query.craftId = new mongoose.Types.ObjectId();
          }
        }
      }
    }
    if (district) query.district = { $regex: district, $options: 'i' };
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceQuery: Record<string, number> = {};
      if (minPrice !== undefined) priceQuery.$gte = minPrice;
      if (maxPrice !== undefined) priceQuery.$lte = maxPrice;
      query.sellingPrice = priceQuery;
    }
    if (rating !== undefined) query.rating = { $gte: rating };
    if (isHandmade !== undefined) query.isHandmade = isHandmade;
    if (isFeatured) query.isFeatured = true;
    if (isBestseller) query.isBestseller = true;
    if (isNew) query.isNewArrival = true;
    if (inStock) query.stockQuantity = { $gt: 0 };
    if (sellerId) query.sellerId = sellerId;

    let sortObj: any = { isFeatured: -1, salesCount: -1 };
    switch (sort) {
      case 'newest':
        sortObj = { publishedAt: -1 };
        break;
      case 'price-asc':
        sortObj = { sellingPrice: 1 };
        break;
      case 'price-desc':
        sortObj = { sellingPrice: -1 };
        break;
      case 'popular':
        sortObj = { salesCount: -1 };
        break;
      case 'rating':
        sortObj = { rating: -1, reviewCount: -1 };
        break;
      default:
        sortObj = search ? { score: { $meta: 'textScore' } } : { isFeatured: -1, salesCount: -1 };
    }

    const skip = (page - 1) * Math.min(limit, 100);

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(Math.min(limit, 100))
        .select('-description -commissionRate -profitShareRate')
        .populate('categoryId', 'name slug')
        .populate('craftId', 'name slug')
        .populate({
          path: 'sellerId',
          select: 'slug district state',
          populate: { path: 'userId', select: 'name avatar' },
        })
        .lean(),
      Product.countDocuments(query),
    ]);

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  // ─── Get by Slug (public) ─────────────────────────────────────────────────

  static async getBySlug(slug: string) {
    const product = await Product.findOne({ slug, status: ProductStatus.PUBLISHED, deletedAt: null })
      .populate('categoryId', 'name slug')
      .populate('craftId', 'name slug origin technique')
      .populate({
        path: 'sellerId',
        select: 'slug district state craftType artisanStory yearsOfExperience rating reviewCount totalProducts photo',
        populate: { path: 'userId', select: 'name avatar' },
      })
      .lean();

    if (!product) throw new NotFoundError('Product not found');
    return product;
  }

  // ─── Get Related Products ─────────────────────────────────────────────────

  static async getRelated(productId: string, categoryId: string, craftId: string, limit = 6) {
    return Product.find({
      _id: { $ne: productId },
      $or: [{ categoryId }, { craftId }],
      status: ProductStatus.PUBLISHED,
      deletedAt: null,
    })
      .limit(limit)
      .select('name slug images sellingPrice rating reviewCount district sellerId')
      .populate({ path: 'sellerId', populate: { path: 'userId', select: 'name' } })
      .lean();
  }

  // ─── Create (seller/admin) ────────────────────────────────────────────────

  static async create(sellerId: string, data: Partial<IProduct>) {
    const baseSlug = slugify(data.name || '', { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    while (await Product.exists({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const sku = `UN-${nanoid(8).toUpperCase()}`;

    const product = await Product.create({
      ...data,
      slug,
      sku,
      sellerId,
      status: data.status || ProductStatus.SUBMITTED,
    });

    return product;
  }

  // ─── Update (seller/admin) ────────────────────────────────────────────────

  static async update(
    id: string,
    sellerId: string | string[],
    isAdmin: boolean,
    data: Partial<IProduct>
  ) {
    const product = await Product.findById(id);
    if (!product) throw new NotFoundError('Product not found');
    const allowed = Array.isArray(sellerId) ? sellerId : [sellerId];
    if (!isAdmin && !allowed.includes(product.sellerId.toString())) {
      throw new ForbiddenError('You do not own this product');
    }

    // Sellers cannot directly publish — must go through approval
    if (!isAdmin && data.status === ProductStatus.PUBLISHED) {
      data.status = ProductStatus.SUBMITTED;
    }

    Object.assign(product, data);
    await product.save();
    return product;
  }

  // ─── Soft delete ──────────────────────────────────────────────────────────

  static async softDelete(id: string, sellerId: string | string[], isAdmin: boolean) {
    const product = await Product.findById(id);
    if (!product) throw new NotFoundError('Product not found');
    const allowed = Array.isArray(sellerId) ? sellerId : [sellerId];
    if (!isAdmin && !allowed.includes(product.sellerId.toString())) {
      throw new ForbiddenError('You do not own this product');
    }
    product.deletedAt = new Date();
    await product.save();
  }

  // ─── Admin: Approve / Reject ──────────────────────────────────────────────

  static async setStatus(id: string, status: ProductStatus, adminNotes?: string) {
    const update: Partial<IProduct> = { status };
    if (status === ProductStatus.PUBLISHED) {
      update.publishedAt = new Date();
    }
    if (adminNotes !== undefined) {
      update.adminNotes = adminNotes;
    }
    const product = await Product.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!product) throw new NotFoundError('Product not found');
    return product;
  }
}
