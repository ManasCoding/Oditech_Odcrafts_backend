import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/rbac.js';
import {
  User,
  UserRole,
  SellerProfile,
  SellerStatus,
  Product,
  ProductStatus,
  Order,
  AuditLog,
  Banner,
  Category,
  Craft,
} from '../../database/models/index.js';
import { NotFoundError } from '../../common/errors/AppError.js';

const router = Router();

// Protect all admin routes with authentication and ADMIN role check
router.use(authenticate, requireAdmin);

// ─── 1. Admin Dashboard Metrics ──────────────────────────────────────────────
router.get('/metrics', async (_req, res, next) => {
  try {
    const [
      totalUsers,
      totalSellers,
      pendingSellers,
      totalProducts,
      pendingProducts,
      totalOrders,
      ordersAgg,
    ] = await Promise.all([
      User.countDocuments({ role: UserRole.CUSTOMER, deletedAt: null }),
      SellerProfile.countDocuments({ status: SellerStatus.APPROVED }),
      SellerProfile.countDocuments({ status: SellerStatus.PENDING }),
      Product.countDocuments({ deletedAt: null }),
      Product.countDocuments({
        status: { $in: [ProductStatus.SUBMITTED, ProductStatus.DRAFT] },
        deletedAt: null,
      }),
      Order.countDocuments(),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$grandTotal' },
            pendingPayment: {
              $sum: { $cond: [{ $eq: ['$status', 'PENDING_PAYMENT'] }, 1, 0] },
            },
            processingOrders: {
              $sum: { $cond: [{ $in: ['$status', ['CONFIRMED', 'PROCESSING']] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const salesMetrics = ordersAgg[0] || {
      totalSales: 0,
      pendingPayment: 0,
      processingOrders: 0,
    };

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('userId', 'name email')
      .lean();

    res.json({
      status: 'success',
      data: {
        metrics: {
          totalUsers,
          totalSellers,
          pendingSellers,
          totalProducts,
          pendingProducts,
          totalOrders,
          totalSales: salesMetrics.totalSales,
          pendingOrders: salesMetrics.processingOrders,
        },
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── 2. Admin User Management ────────────────────────────────────────────────
router.get('/users', async (req, res, next) => {
  try {
    const { role, status, q, page = '1', limit = '20' } = req.query;
    const query: Record<string, unknown> = {};

    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'suspended') query.isActive = false;
    if (q) {
      query.$or = [
        { name: { $regex: q as string, $options: 'i' } },
        { email: { $regex: q as string, $options: 'i' } },
        { phone: { $regex: q as string, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    res.json({
      status: 'success',
      data: {
        users,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id/status', async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive } },
      { new: true }
    ).select('-passwordHash');

    if (!user) throw new NotFoundError('User not found');

    await AuditLog.create({
      userId: req.user!.id,
      action: isActive ? 'USER_REACTIVATED' : 'USER_SUSPENDED',
      entity: 'User',
      entityId: req.params.id,
    });

    res.json({ status: 'success', data: { user } });
  } catch (error) {
    next(error);
  }
});

// ─── 3. Admin Artisan Management ─────────────────────────────────────────────
router.get('/artisans', async (req, res, next) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const query: Record<string, unknown> = {};
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [artisans, total] = await Promise.all([
      SellerProfile.find(query)
        .populate('userId', 'name email phone avatar createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      SellerProfile.countDocuments(query),
    ]);

    res.json({
      status: 'success',
      data: {
        artisans,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/artisans/:id/status', async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const artisan = await SellerProfile.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status,
          adminNotes,
          ...(status === 'APPROVED' ? { approvedAt: new Date() } : {}),
          ...(status === 'REJECTED' ? { rejectedAt: new Date() } : {}),
          ...(status === 'SUSPENDED' ? { suspendedAt: new Date() } : {}),
        },
      },
      { new: true }
    ).populate('userId', 'name email');

    if (!artisan) throw new NotFoundError('Artisan profile not found');

    await AuditLog.create({
      userId: req.user!.id,
      action: `ARTISAN_${status}`,
      entity: 'SellerProfile',
      entityId: req.params.id,
      metadata: { adminNotes },
    });

    res.json({ status: 'success', data: { artisan } });
  } catch (error) {
    next(error);
  }
});

// ─── 4. Admin Product Management & Approvals ─────────────────────────────────
router.get('/products', async (req, res, next) => {
  try {
    const { status, q, page = '1', limit = '20' } = req.query;

    // Self-heal: ensure any legacy products where sellerId matches a User are migrated
    const productsToCheck = await Product.find({ deletedAt: null }).select('_id sellerId').lean();
    for (const p of productsToCheck) {
      const isSeller = await SellerProfile.exists({ _id: p.sellerId });
      if (!isSeller) {
        let seller = await SellerProfile.findOne({ userId: p.sellerId });
        if (!seller) {
          const user = await User.findById(p.sellerId);
          const nameSlug = user?.name ? user.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'artisan';
          const baseSlug = nameSlug || `artisan-${Date.now()}`;
          let slug = baseSlug;
          let count = 1;
          while (await SellerProfile.exists({ slug })) {
            slug = `${baseSlug}-${count++}`;
          }
          seller = await SellerProfile.create({
            userId: p.sellerId,
            slug,
            status: SellerStatus.APPROVED,
            district: 'Odisha',
            state: 'Odisha',
          });
        }
        await Product.updateOne({ _id: p._id }, { $set: { sellerId: seller._id } });
      }
    }

    const query: Record<string, unknown> = { deletedAt: null };

    if (status && status !== 'ALL') {
      if (status === 'PENDING') {
        query.status = { $in: [ProductStatus.SUBMITTED, ProductStatus.DRAFT] };
      } else {
        query.status = status;
      }
    }

    if (q) {
      query.$or = [
        { name: { $regex: q as string, $options: 'i' } },
        { sku: { $regex: q as string, $options: 'i' } },
        { district: { $regex: q as string, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total, counts] = await Promise.all([
      Product.find(query)
        .populate('categoryId', 'name slug')
        .populate('craftId', 'name slug')
        .populate({
          path: 'sellerId',
          populate: { path: 'userId', select: 'name email phone avatar' },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(query),
      Product.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const statusCounts: Record<string, number> = {
      ALL: 0,
      PENDING: 0,
      SUBMITTED: 0,
      PUBLISHED: 0,
      DRAFT: 0,
      REJECTED: 0,
    };

    let allCount = 0;
    for (const item of counts) {
      statusCounts[item._id] = item.count;
      allCount += item.count;
      if (item._id === ProductStatus.SUBMITTED || item._id === ProductStatus.DRAFT) {
        statusCounts.PENDING += item.count;
      }
    }
    statusCounts.ALL = allCount;

    res.json({
      status: 'success',
      data: {
        products,
        statusCounts,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/products/:id/status', async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const update: any = { status };
    if (status === ProductStatus.PUBLISHED) {
      update.publishedAt = new Date();
    }
    if (adminNotes !== undefined) {
      update.adminNotes = adminNotes;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    )
      .populate('categoryId', 'name slug')
      .populate('craftId', 'name slug')
      .populate({
        path: 'sellerId',
        populate: { path: 'userId', select: 'name email phone' },
      });

    if (!product) throw new NotFoundError('Product not found');

    await AuditLog.create({
      userId: req.user!.id,
      action: `PRODUCT_${status}`,
      entity: 'Product',
      entityId: req.params.id,
      metadata: { adminNotes },
    });

    res.json({ status: 'success', data: { product } });
  } catch (error) {
    next(error);
  }
});

// ─── 5. Admin Audit Logs ─────────────────────────────────────────────────────
router.get('/audit-logs', async (req, res, next) => {
  try {
    const { page = '1', limit = '30' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'name email')
        .lean(),
      AuditLog.countDocuments(),
    ]);

    res.json({
      status: 'success',
      data: {
        logs,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── 5. Admin Settings & Content ─────────────────────────────────────────────
router.get('/banners', async (_req, res, next) => {
  try {
    const banners = await Banner.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
    res.json({ status: 'success', data: { banners } });
  } catch (error) {
    next(error);
  }
});

router.post('/banners', async (req, res, next) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json({ status: 'success', data: { banner } });
  } catch (error) {
    next(error);
  }
});

router.delete('/banners/:id', async (req, res, next) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ status: 'success', message: 'Banner removed' });
  } catch (error) {
    next(error);
  }
});

export default router;
