const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { Wishlist, Product, ProductStatus } = require('../models');
const { NotFoundError } = require('../utils/AppError');

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ userId: req.user.id }).lean();
    if (!wishlist) wishlist = await Wishlist.create({ userId: req.user.id, items: [] });
    res.json({ status: 'success', data: { wishlist } });
  } catch (error) {
    next(error);
  }
});

router.post('/items', async (req, res, next) => {
  try {
    const { productId } = req.body;

    const product = await Product.findOne({ _id: productId, status: ProductStatus.PUBLISHED, deletedAt: null })
      .populate({ path: 'sellerId', populate: { path: 'userId', select: 'name' } })
      .lean();

    if (!product) throw new NotFoundError('Product not found');

    const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
    const seller = product.sellerId;

    const wishlist = await Wishlist.findOneAndUpdate(
      { userId: req.user.id },
      { $setOnInsert: { userId: req.user.id, items: [] } },
      { upsert: true, new: true }
    );

    const alreadyInWishlist = wishlist.items.some((item) => item.productId.toString() === productId);

    if (!alreadyInWishlist) {
      wishlist.items.push({
        productId: product._id,
        productName: product.name,
        productSlug: product.slug,
        productImage: primaryImage?.url,
        sellingPrice: product.sellingPrice,
        sellerId: seller._id,
        addedAt: new Date(),
      });
      await wishlist.save();
    }

    res.status(201).json({ status: 'success', data: { wishlist, alreadyExists: alreadyInWishlist } });
  } catch (error) {
    next(error);
  }
});

router.delete('/items/:itemId', async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user.id });
    if (!wishlist) throw new NotFoundError('Wishlist not found');
    const item = wishlist.items.id(req.params.itemId);
    if (!item) throw new NotFoundError('Item not found');
    item.deleteOne();
    await wishlist.save();
    res.json({ status: 'success', data: { wishlist } });
  } catch (error) {
    next(error);
  }
});

router.get('/check/:productId', async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user.id, 'items.productId': req.params.productId }).lean();
    res.json({ status: 'success', data: { inWishlist: !!wishlist } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
