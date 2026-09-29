const { Router } = require('express');
const { SellerProfile, Product, Order, SellerWallet } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requireSeller } = require('../middleware/rbac');

const router = Router();
router.use(authenticate, requireSeller);

router.get('/profile', async (req, res, next) => {
  try {
    const profile = await SellerProfile.findOne({ userId: req.user.id }).lean();
    res.json({ status: 'success', data: { profile } });
  } catch (error) {
    next(error);
  }
});

router.patch('/profile', async (req, res, next) => {
  try {
    const profile = await SellerProfile.findOneAndUpdate({ userId: req.user.id }, req.body, { new: true });
    res.json({ status: 'success', data: { profile } });
  } catch (error) {
    next(error);
  }
});

router.get('/products', async (req, res, next) => {
  try {
    const profile = await SellerProfile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ status: 'error', message: 'Seller profile not found' });
    const products = await Product.find({ sellerId: profile._id, deletedAt: null }).sort({ createdAt: -1 }).lean();
    res.json({ status: 'success', data: { products } });
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard', async (req, res, next) => {
  try {
    const profile = await SellerProfile.findOne({ userId: req.user.id });
    if (!profile) return res.status(404).json({ status: 'error', message: 'Seller profile not found' });
    
    let wallet = await SellerWallet.findOne({ sellerId: profile._id }).lean();
    if (!wallet) wallet = { availableBalance: 0, pendingBalance: 0, totalEarned: 0 };
    
    res.json({
      status: 'success',
      data: {
        stats: {
          totalSales: profile.totalSales,
          totalProducts: profile.totalProducts,
          rating: profile.rating,
        },
        wallet,
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
