import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireSeller } from '../../middleware/rbac.js';
import {
  SellerProfile,
  SellerStatus,
  Product,
  Order,
  SellerWallet,
  User,
} from '../../database/models/index.js';
import { NotFoundError, ValidationError } from '../../common/errors/AppError.js';

const router = Router();

// Require seller or admin auth
router.use(authenticate, requireSeller);

// ─── 1. Seller Profile ───────────────────────────────────────────────────────
router.get('/profile', async (req, res, next) => {
  try {
    let profile = await SellerProfile.findOne({ userId: req.user!.id })
      .populate('userId', 'name email phone avatar')
      .lean();

    if (!profile) {
      profile = await SellerProfile.create({
        userId: req.user!.id,
        slug: `artisan-${Date.now()}`,
        status: SellerStatus.PENDING,
      });
    }

    res.json({ status: 'success', data: { profile } });
  } catch (error) {
    next(error);
  }
});

router.patch('/profile', async (req, res, next) => {
  try {
    const profile = await SellerProfile.findOneAndUpdate(
      { userId: req.user!.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!profile) throw new NotFoundError('Seller profile not found');
    res.json({ status: 'success', data: { profile } });
  } catch (error) {
    next(error);
  }
});

// ─── 2. Seller Products ──────────────────────────────────────────────────────
router.get('/products', async (req, res, next) => {
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
        district: 'Bargarh',
        state: 'Odisha',
      });
    }

    // Self-heal: ensure any products created with req.user.id are migrated to seller._id
    await Product.updateMany(
      { sellerId: req.user!.id },
      { $set: { sellerId: seller._id } }
    );

    const products = await Product.find({
      $or: [{ sellerId: seller._id }, { sellerId: req.user!.id }],
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .populate('categoryId', 'name')
      .populate('craftId', 'name')
      .lean();

    res.json({ status: 'success', data: { products } });
  } catch (error) {
    next(error);
  }
});

// ─── 3. Seller Orders ────────────────────────────────────────────────────────
router.get('/orders', async (req, res, next) => {
  try {
    const seller = await SellerProfile.findOne({ userId: req.user!.id });
    if (!seller) {
      res.json({ status: 'success', data: { orders: [] } });
      return;
    }

    // Find orders containing this seller's products
    const orders = await Order.find({
      'sellerOrders.sellerId': seller._id,
    })
      .sort({ createdAt: -1 })
      .select('orderNumber createdAt addressSnapshot grandTotal sellerOrders')
      .lean();

    // Map to seller-relevant views
    const sellerSpecificOrders = orders.map((o) => {
      const mySubOrder = o.sellerOrders.find(
        (so) => so.sellerId.toString() === seller._id.toString()
      );
      return {
        orderId: o._id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        shippingAddress: o.addressSnapshot,
        subOrder: mySubOrder,
      };
    });

    res.json({ status: 'success', data: { orders: sellerSpecificOrders } });
  } catch (error) {
    next(error);
  }
});

// ─── 4. Seller Earnings & Wallet ─────────────────────────────────────────────
router.get('/earnings', async (req, res, next) => {
  try {
    let seller = await SellerProfile.findOne({ userId: req.user!.id });
    if (!seller) {
      seller = await SellerProfile.create({
        userId: req.user!.id,
        slug: `artisan-${Date.now()}`,
        status: SellerStatus.APPROVED,
        district: 'Bargarh',
        state: 'Odisha',
      });
    }

    // Calculate actual earnings dynamically from orders
    const orders = await Order.find({
      'sellerOrders.sellerId': seller._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    let totalEarned = 0;
    let pendingBalance = 0;
    let availableBalance = 0;

    const recentTransactions = orders.slice(0, 15).map((o) => {
      const mySub = o.sellerOrders.find(
        (so) => so.sellerId.toString() === seller!._id.toString()
      );
      const gross = mySub?.subtotal || 0;
      const commission = mySub?.platformCommission || gross * 0.1;
      const net = mySub?.sellerEarning || gross * 0.9;

      return {
        orderId: o._id,
        orderNumber: o.orderNumber,
        date: o.createdAt,
        status: o.status,
        grossAmount: Math.round(gross),
        platformCommission: Math.round(commission),
        netEarnings: Math.round(net),
      };
    });

    for (const o of orders) {
      const mySub = o.sellerOrders.find(
        (so) => so.sellerId.toString() === seller!._id.toString()
      );
      if (mySub) {
        const net = mySub.sellerEarning || mySub.subtotal * 0.9;
        totalEarned += net;
        if (o.status === 'DELIVERED') {
          availableBalance += net;
        } else if (o.status !== 'CANCELLED') {
          pendingBalance += net;
        }
      }
    }

    let wallet = await SellerWallet.findOne({ sellerId: seller._id });
    if (!wallet) {
      wallet = await SellerWallet.create({
        sellerId: seller._id,
        availableBalance: Math.max(0, Math.round(availableBalance)),
        pendingBalance: Math.max(0, Math.round(pendingBalance)),
        totalEarned: Math.max(0, Math.round(totalEarned)),
        totalPaidOut: 0,
      });
    } else {
      wallet.totalEarned = Math.max(0, Math.round(totalEarned));
      wallet.pendingBalance = Math.max(0, Math.round(pendingBalance));
      const calculatedAvail = Math.round(availableBalance) - (wallet.totalPaidOut || 0);
      wallet.availableBalance = Math.max(0, calculatedAvail);
      await wallet.save();
    }

    res.json({
      status: 'success',
      data: {
        wallet,
        transactions: recentTransactions,
        bankDetails: {
          bankName: seller.bankName || '',
          bankAccountName: seller.bankAccountName || '',
          bankAccountNumber: seller.bankAccountNumber || '',
          bankIFSC: seller.bankIFSC || '',
          panNumber: seller.panNumber || '',
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/withdraw', async (req, res, next) => {
  try {
    const { amount } = req.body;
    const withdrawAmount = Number(amount);

    if (!withdrawAmount || withdrawAmount <= 0) {
      throw new ValidationError('Please specify a valid withdrawal amount greater than ₹0');
    }

    const seller = await SellerProfile.findOne({ userId: req.user!.id });
    if (!seller) throw new NotFoundError('Seller not found');

    if (!seller.bankAccountNumber || !seller.bankIFSC) {
      throw new ValidationError('Please link your bank account details before requesting a withdrawal.');
    }

    const wallet = await SellerWallet.findOne({ sellerId: seller._id });
    if (!wallet || wallet.availableBalance < withdrawAmount) {
      throw new ValidationError(`Insufficient balance. Maximum available for payout: ₹${wallet?.availableBalance || 0}`);
    }

    wallet.availableBalance -= withdrawAmount;
    wallet.totalPaidOut += withdrawAmount;
    await wallet.save();

    res.json({
      status: 'success',
      message: `Payout request of ₹${withdrawAmount.toLocaleString('en-IN')} initiated successfully to ${seller.bankName || 'bank account'}!`,
      data: { wallet },
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/bank-details', async (req, res, next) => {
  try {
    const { bankName, bankAccountName, bankAccountNumber, bankIFSC, panNumber } = req.body;
    const seller = await SellerProfile.findOneAndUpdate(
      { userId: req.user!.id },
      {
        $set: {
          bankName,
          bankAccountName,
          bankAccountNumber,
          bankIFSC,
          panNumber,
        },
      },
      { new: true }
    );

    if (!seller) throw new NotFoundError('Artisan profile not found');

    res.json({
      status: 'success',
      message: 'Bank payout details updated successfully',
      data: {
        bankDetails: {
          bankName: seller.bankName,
          bankAccountName: seller.bankAccountName,
          bankAccountNumber: seller.bankAccountNumber,
          bankIFSC: seller.bankIFSC,
          panNumber: seller.panNumber,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
