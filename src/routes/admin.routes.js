const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { User, Product, SellerProfile, Order, AuditLog, Banner } = require('../models');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/metrics', async (_req, res, next) => {
  try {
    const [totalUsers, totalProducts, totalOrders, totalSalesResult] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ status: 'PUBLISHED', deletedAt: null }),
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$grandTotal' } } }])
    ]);
    res.json({
      status: 'success',
      data: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalSales: totalSalesResult[0]?.total || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/admins', async (req, res, next) => {
  try {
    const admins = await User.find({ role: 'ADMIN' }).select('-passwordHash').sort({ createdAt: -1 }).lean();
    res.json({ status: 'success', data: { admins } });
  } catch (error) {
    next(error);
  }
});

router.post('/admins', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ status: 'error', message: 'Name, email and password are required' });
    }
    
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ status: 'error', message: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const phone = req.body.phone || 'temp-' + Date.now();
    
    const newAdmin = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true
    });

    const adminWithoutPwd = newAdmin.toObject();
    delete adminWithoutPwd.passwordHash;

    res.status(201).json({ status: 'success', data: { admin: adminWithoutPwd } });
  } catch (error) {
    next(error);
  }
});

router.delete('/admins/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
       return res.status(400).json({ status: 'error', message: 'You cannot delete yourself' });
    }
    await User.findByIdAndDelete(id);
    res.json({ status: 'success', message: 'Admin deleted successfully' });
  } catch (error) {
    next(error);
  }
});

router.put('/change-password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });
    
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return res.status(400).json({ status: 'error', message: 'Invalid current password' });
    
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ status: 'success', message: 'Password changed successfully' });
  } catch(error) {
    next(error);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
    res.json({ status: 'success', data: { users } });
  } catch (error) {
    next(error);
  }
});

router.get('/users/:id', async (req, res, next) => {
  try {
    const [user, orders] = await Promise.all([
      User.findById(req.params.id).select('-passwordHash').lean(),
      Order.find({ userId: req.params.id }).sort({ createdAt: -1 }).lean(),
    ]);
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });
    res.json({ status: 'success', data: { user, orders } });
  } catch (error) {
    next(error);
  }
});

router.get('/sellers', async (req, res, next) => {
  try {
    const sellers = await SellerProfile.find().populate('userId', 'name email phone').sort({ createdAt: -1 }).lean();
    res.json({ status: 'success', data: { sellers } });
  } catch (error) {
    next(error);
  }
});

router.patch('/sellers/:id/status', async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const seller = await SellerProfile.findByIdAndUpdate(req.params.id, { status, adminNotes }, { new: true });
    res.json({ status: 'success', data: { seller } });
  } catch (error) {
    next(error);
  }
});

router.get('/audit-logs', async (req, res, next) => {
  try {
    const logs = await AuditLog.find().populate('userId', 'name').sort({ createdAt: -1 }).limit(100).lean();
    res.json({ status: 'success', data: { logs } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

