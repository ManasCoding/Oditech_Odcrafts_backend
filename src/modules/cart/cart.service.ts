import mongoose from 'mongoose';
import { Cart, Product, ProductStatus } from '../../database/models/index.js';
import { NotFoundError, ValidationError } from '../../common/errors/AppError.js';

export class CartService {
  static async getCart(userId: string) {
    let cart = await Cart.findOne({ userId }).lean();
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }
    return cart;
  }

  static async addItem(userId: string, productId: string, quantity: number) {
    // Validate product
    const product = await Product.findOne({
      _id: productId,
      status: ProductStatus.PUBLISHED,
      deletedAt: null,
    })
      .populate({ path: 'sellerId', populate: { path: 'userId', select: 'name' } })
      .lean();

    if (!product) throw new NotFoundError('Product not found or unavailable');

    const available = product.stockQuantity - product.reservedQuantity;
    if (available < quantity) {
      throw new ValidationError(
        available === 0
          ? 'This product is out of stock'
          : `Only ${available} unit(s) available`
      );
    }

    const seller: any = product.sellerId;
    const sellerUser = seller?.userId;

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId, items: [] } },
      { upsert: true, new: true }
    );

    const existingIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (existingIndex >= 0) {
      // Update quantity
      const newQty = cart.items[existingIndex].quantity + quantity;
      if (newQty > available) {
        throw new ValidationError(`Only ${available} unit(s) available`);
      }
      cart.items[existingIndex].quantity = newQty;
      cart.items[existingIndex].totalPrice = product.sellingPrice * newQty;
      cart.items[existingIndex].stockQuantity = product.stockQuantity;
    } else {
      // Add new item
      const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
      (cart.items as any).push({
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

  static async updateQuantity(userId: string, itemId: string, quantity: number) {
    const cart = await Cart.findOne({ userId });
    if (!cart) throw new NotFoundError('Cart not found');

    const item = (cart.items as any).id(itemId);
    if (!item) throw new NotFoundError('Cart item not found');

    if (quantity <= 0) {
      item.deleteOne();
    } else {
      // Re-validate stock
      const product = await Product.findById(item.productId).select('stockQuantity reservedQuantity').lean();
      if (!product) throw new NotFoundError('Product no longer available');
      const available = product.stockQuantity - product.reservedQuantity;
      if (quantity > available) {
        throw new ValidationError(`Only ${available} unit(s) available`);
      }
      item.quantity = quantity;
      item.totalPrice = item.unitPrice * quantity;
      item.stockQuantity = product.stockQuantity;
    }

    await cart.save();
    return cart;
  }

  static async removeItem(userId: string, itemId: string) {
    const cart = await Cart.findOne({ userId });
    if (!cart) throw new NotFoundError('Cart not found');
    const item = (cart.items as any).id(itemId);
    if (!item) throw new NotFoundError('Cart item not found');
    item.deleteOne();
    await cart.save();
    return cart;
  }

  static async clearCart(userId: string) {
    await Cart.updateOne({ userId }, { $set: { items: [] } });
  }

  static async getCartSummary(userId: string) {
    const cart = await Cart.findOne({ userId }).lean();
    if (!cart || cart.items.length === 0) {
      return { subtotal: 0, itemCount: 0, sellerCount: 0 };
    }

    const activeItems = cart.items.filter((i) => !i.savedForLater);
    const subtotal = activeItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const sellerIds = new Set(activeItems.map((i) => i.sellerId.toString()));

    return {
      subtotal,
      itemCount: activeItems.reduce((sum, item) => sum + item.quantity, 0),
      sellerCount: sellerIds.size,
    };
  }
}
