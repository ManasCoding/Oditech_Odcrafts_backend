const { Cart, Product, ProductStatus } = require('../models');
const { NotFoundError, ValidationError } = require('../utils/AppError');

async function getCart(userId) {
  let cart = await Cart.findOne({ userId }).lean();
  if (!cart) cart = await Cart.create({ userId, items: [] });
  return cart;
}

async function addItem(userId, productId, quantity) {
  const product = await Product.findOne({ _id: productId, status: ProductStatus.PUBLISHED, deletedAt: null })
    .populate({ path: 'sellerId', populate: { path: 'userId', select: 'name' } })
    .lean();

  if (!product) throw new NotFoundError('Product not found or unavailable');

  const available = product.stockQuantity - product.reservedQuantity;
  if (available < quantity) {
    throw new ValidationError(available === 0 ? 'This product is out of stock' : `Only ${available} unit(s) available`);
  }

  const seller = product.sellerId;
  const sellerUser = seller?.userId;

  const cart = await Cart.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, items: [] } },
    { upsert: true, new: true }
  );

  const existingIndex = cart.items.findIndex((item) => item.productId.toString() === productId);

  if (existingIndex >= 0) {
    const newQty = cart.items[existingIndex].quantity + quantity;
    if (newQty > available) throw new ValidationError(`Only ${available} unit(s) available`);
    cart.items[existingIndex].quantity = newQty;
    cart.items[existingIndex].totalPrice = product.sellingPrice * newQty;
    cart.items[existingIndex].stockQuantity = product.stockQuantity;
  } else {
    const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
    cart.items.push({
      productId: product._id,
      productName: product.name,
      productSlug: product.slug,
      productImage: primaryImage?.url,
      sellerId: seller._id,
      sellerName: sellerUser?.name || 'Artisan',
      sku: product.sku,
      quantity,
      unitPrice: product.sellingPrice,
      totalPrice: product.sellingPrice * quantity,
      stockQuantity: product.stockQuantity,
      savedForLater: false,
      addedAt: new Date(),
    });
  }

  await cart.save();
  return cart;
}

async function updateQuantity(userId, itemId, quantity) {
  const cart = await Cart.findOne({ userId });
  if (!cart) throw new NotFoundError('Cart not found');

  const item = cart.items.id(itemId);
  if (!item) throw new NotFoundError('Cart item not found');

  if (quantity <= 0) {
    item.deleteOne();
  } else {
    const product = await Product.findById(item.productId).select('stockQuantity reservedQuantity').lean();
    if (!product) throw new NotFoundError('Product no longer available');
    const available = product.stockQuantity - product.reservedQuantity;
    if (quantity > available) throw new ValidationError(`Only ${available} unit(s) available`);
    item.quantity = quantity;
    item.totalPrice = item.unitPrice * quantity;
    item.stockQuantity = product.stockQuantity;
  }

  await cart.save();
  return cart;
}

async function removeItem(userId, itemId) {
  const cart = await Cart.findOne({ userId });
  if (!cart) throw new NotFoundError('Cart not found');
  const item = cart.items.id(itemId);
  if (!item) throw new NotFoundError('Cart item not found');
  item.deleteOne();
  await cart.save();
  return cart;
}

async function clearCart(userId) {
  await Cart.updateOne({ userId }, { $set: { items: [] } });
}

module.exports = { getCart, addItem, updateQuantity, removeItem, clearCart };
