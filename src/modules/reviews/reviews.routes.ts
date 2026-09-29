import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { Review, Order } from '../../database/models/index.js';
import { Product } from '../../database/models/index.js';
import { ValidationError, ForbiddenError, NotFoundError } from '../../common/errors/AppError.js';

const router = Router();

// Get reviews for a product (public)
router.get('/product/:productId', async (req, res, next) => {
  try {
    const reviews = await Review.find({
      productId: req.params.productId,
      isApproved: true,
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .populate('userId', 'name avatar')
      .lean();
    res.json({ status: 'success', data: { reviews } });
  } catch (error) {
    next(error);
  }
});

// Create review (must have purchased product)
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { productId, orderId, rating, title, comment } = req.body;

    // Verify purchase
    const order = await Order.findOne({
      _id: orderId,
      userId: req.user!.id,
      'sellerOrders.items.productId': productId,
    });
    if (!order) throw new ForbiddenError('You can only review products you have purchased');

    const existingReview = await Review.findOne({ productId, userId: req.user!.id, orderId });
    if (existingReview) throw new ValidationError('You have already reviewed this product');

    const review = await Review.create({
      productId,
      userId: req.user!.id,
      orderId,
      rating,
      title,
      comment,
      isVerifiedPurchase: true,
      isApproved: true, // Auto-approve for now; add moderation later
    });

    // Update product rating
    const allReviews = await Review.find({ productId, isApproved: true }).select('rating').lean();
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: allReviews.length,
    });

    res.status(201).json({ status: 'success', data: { review } });
  } catch (error) {
    next(error);
  }
});

export default router;
