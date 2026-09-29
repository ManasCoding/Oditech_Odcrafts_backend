import { Router } from 'express';
import { SellerProfile, SellerStatus, Product, ProductStatus } from '../../database/models/index.js';
import { NotFoundError } from '../../common/errors/AppError.js';

const router = Router();

// Public: List artisans (approved sellers only)
router.get('/', async (req, res, next) => {
  try {
    const { craft, district, q, page = '1', limit = '20' } = req.query;
    const query: any = { status: SellerStatus.APPROVED };

    if (craft) query.craftType = { $regex: craft, $options: 'i' };
    if (district) query.district = { $regex: district, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);

    const [sellers, total] = await Promise.all([
      SellerProfile.find(query)
        .skip(skip)
        .limit(Number(limit))
        .select('slug craftType district state artisanStory photo rating reviewCount totalProducts totalSales yearsOfExperience')
        .populate('userId', 'name avatar')
        .lean(),
      SellerProfile.countDocuments(query),
    ]);

    // If searching by name
    let filteredSellers = sellers;
    if (q) {
      const searchTerm = (q as string).toLowerCase();
      filteredSellers = sellers.filter((s: any) => {
        const user = s.userId;
        return (
          user?.name?.toLowerCase().includes(searchTerm) ||
          s.craftType?.toLowerCase().includes(searchTerm)
        );
      });
    }

    res.json({
      status: 'success',
      data: {
        artisans: filteredSellers,
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

// Public: Get artisan by slug
router.get('/:slug', async (req, res, next) => {
  try {
    const seller = await SellerProfile.findOne({ slug: req.params.slug, status: SellerStatus.APPROVED })
      .select('-bankAccountName -bankAccountNumber -bankIFSC -bankName -panNumber -gstin -businessRegistration')
      .populate('userId', 'name avatar email')
      .lean();

    if (!seller) throw new NotFoundError('Artisan not found');

    // Fetch their published products
    const products = await Product.find({ sellerId: seller._id, status: ProductStatus.PUBLISHED, deletedAt: null })
      .limit(12)
      .select('name slug images sellingPrice rating reviewCount district isNewArrival isFeatured isBestseller')
      .lean();

    res.json({ status: 'success', data: { artisan: seller, products } });
  } catch (error) {
    next(error);
  }
});

export default router;
