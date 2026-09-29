const { Router } = require('express');
const { Review, Product, Order } = require('../models');
const { authenticate } = require('../middleware/auth');
const { ValidationError } = require('../utils/AppError');

const router = Router();

router.get('/product/:productId', async (req, res, next) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId, isApproved: true })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ status: 'success', data: { reviews } });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { productId, orderId, rating, title, comment } = req.body;

    const order = await Order.findOne({ _id: orderId, userId: req.user.id, status: 'DELIVERED' });
    if (!order) throw new ValidationError('You can only review products you have purchased and received');

    const existingReview = await Review.findOne({ productId, userId: req.user.id, orderId });
    if (existingReview) throw new ValidationError('You have already reviewed this product');

    const review = await Review.create({
      productId,
      userId: req.user.id,
      orderId,
      rating,
      title,
      comment,
      isVerifiedPurchase: true,
      isApproved: true,
    });

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

module.exports = router;
