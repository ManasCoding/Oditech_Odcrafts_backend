const mongoose = require('mongoose');
const {
  Order, Cart, Product, ProductStatus,
  SellerProfile, Address, Notification, NotificationType,
  OrderStatus, PaymentStatus, AuditLog,
} = require('../models');
const { NotFoundError, ValidationError, ForbiddenError } = require('../utils/AppError');
const { randomBytes } = require('crypto');

function generateOrderNumber() {
  return `OC${Date.now()}${randomBytes(2).toString('hex').toUpperCase()}`;
}

async function createFromCart(userId, addressId) {
  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) throw new NotFoundError('Address not found');

  const cart = await Cart.findOne({ userId });
  if (!cart || cart.items.length === 0) throw new ValidationError('Your cart is empty');

  const activeItems = cart.items.filter((i) => !i.savedForLater);
  if (activeItems.length === 0) throw new ValidationError('No active items in cart');

  const client = mongoose.connection.getClient();
  const topologyType = client?.topology?.description?.type;
  const supportsTransactions =
    topologyType === 'ReplicaSetWithPrimary' ||
    topologyType === 'ReplicaSetNoPrimary' ||
    topologyType === 'Sharded';

  let session = null;
  if (supportsTransactions) {
    session = await mongoose.startSession();
    session.startTransaction();
  }

  const appliedStockDeductions = [];

  try {
    const productIds = activeItems.map((i) => i.productId);
    const productsQuery = Product.find({ _id: { $in: productIds }, status: ProductStatus.PUBLISHED, deletedAt: null });
    if (session) productsQuery.session(session);
    const products = await productsQuery;

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    for (const item of activeItems) {
      const product = productMap.get(item.productId.toString());
      if (!product) throw new ValidationError(`Product "${item.productName}" is no longer available`);
      const available = product.stockQuantity - product.reservedQuantity;
      if (available < item.quantity) {
        throw new ValidationError(`"${product.name}" only has ${available} unit(s) available`);
      }

      const updateResult = await Product.findOneAndUpdate(
        { _id: product._id, stockQuantity: { $gte: item.quantity + product.reservedQuantity } },
        { $inc: { stockQuantity: -item.quantity, salesCount: item.quantity } },
        session ? { session, new: true } : { new: true }
      );
      if (!updateResult) throw new ValidationError(`Stock conflict for "${item.productName}" — please refresh your cart`);
      appliedStockDeductions.push({ productId: product._id, quantity: item.quantity });
    }

    const PLATFORM_COMMISSION_RATE = 0.15;
    const PROFIT_SHARE_RATE = 0.05;
    const SHIPPING_PER_SELLER = 50;

    const sellerGroups = new Map();
    for (const item of activeItems) {
      const sellerId = item.sellerId.toString();
      if (!sellerGroups.has(sellerId)) sellerGroups.set(sellerId, []);
      sellerGroups.get(sellerId).push(item);
    }

    let orderSubtotal = 0;
    let orderShippingTotal = 0;

    const sellerOrders = await Promise.all(
      Array.from(sellerGroups.entries()).map(async ([sellerId, items]) => {
        const sellerQuery = SellerProfile.findById(sellerId).populate('userId', 'name').lean();
        if (session) sellerQuery.session(session);
        const seller = await sellerQuery;

        const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        const commission = subtotal * PLATFORM_COMMISSION_RATE;
        const profitShare = subtotal * PROFIT_SHARE_RATE;
        const sellerEarning = subtotal - commission - profitShare;
        const shippingCharge = SHIPPING_PER_SELLER;

        orderSubtotal += subtotal;
        orderShippingTotal += shippingCharge;

        return {
          sellerId: new mongoose.Types.ObjectId(sellerId),
          sellerName: seller?.userId?.name || 'Artisan',
          items: items.map((item) => {
            const product = productMap.get(item.productId.toString());
            return {
              productId: item.productId,
              productName: item.productName,
              productSlug: item.productSlug,
              productSku: item.sku,
              productImage: item.productImage,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              basePrice: product.basePrice,
              totalPrice: item.unitPrice * item.quantity,
              isReviewed: false,
            };
          }),
          subtotal, shippingCharge, taxAmount: 0,
          sellerEarning, platformCommission: commission, profitShare,
          status: 'AWAITING_FULFILLMENT',
          statusHistory: [{ status: 'AWAITING_FULFILLMENT', changedAt: new Date() }],
        };
      })
    );

    const grandTotal = orderSubtotal + orderShippingTotal;
    const orderNumber = generateOrderNumber();

    const createdOrders = await Order.create(
      [{
        orderNumber,
        userId: new mongoose.Types.ObjectId(userId),
        addressSnapshot: {
          fullName: address.fullName, phone: address.phone, line1: address.line1,
          line2: address.line2, city: address.city, district: address.district,
          state: address.state, pincode: address.pincode, country: address.country,
        },
        sellerOrders,
        subtotal: orderSubtotal, shippingTotal: orderShippingTotal,
        taxTotal: 0, discountTotal: 0, grandTotal,
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: 'CASH_ON_DELIVERY',
        paymentProvider: 'manual',
        statusHistory: [{ status: OrderStatus.CONFIRMED, changedAt: new Date() }],
      }],
      session ? { session } : {}
    );

    const order = createdOrders[0];

    await Cart.updateOne({ userId }, { $pull: { items: { savedForLater: false } } }, session ? { session } : {});
    await Notification.create([{
      userId: new mongoose.Types.ObjectId(userId),
      type: NotificationType.ORDER_UPDATE,
      title: 'Order Placed!',
      message: `Your order #${orderNumber} has been placed successfully.`,
      link: `/orders/${order._id}`,
      data: { orderId: order._id, orderNumber },
    }], session ? { session } : {});

    if (session) await session.commitTransaction();
    return order;
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    } else {
      await Promise.allSettled(
        appliedStockDeductions.map((d) =>
          Product.updateOne({ _id: d.productId }, { $inc: { stockQuantity: d.quantity, salesCount: -d.quantity } })
        )
      );
    }
    throw error;
  } finally {
    if (session) session.endSession();
  }
}

async function getMyOrders(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .select('orderNumber status paymentStatus grandTotal sellerOrders createdAt').lean(),
    Order.countDocuments({ userId }),
  ]);
  return { orders, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
}

async function getById(orderId, userId) {
  const order = await Order.findById(orderId).lean();
  if (!order) throw new NotFoundError('Order not found');
  if (order.userId.toString() !== userId) throw new ForbiddenError('Access denied');
  return order;
}

async function adminList(filters = {}) {
  const { status, page = 1, limit = 20, search } = filters;
  const query = {};
  if (status) query.status = status;
  if (search) query.$or = [{ orderNumber: { $regex: search, $options: 'i' } }];
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'name email phone').lean(),
    Order.countDocuments(query),
  ]);
  return { orders, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
}

async function adminUpdateStatus(orderId, newStatus, adminId, notes) {
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError('Order not found');

  const prevStatus = order.status;
  order.status = newStatus;
  order.statusHistory.push({ status: newStatus, changedAt: new Date(), changedBy: new mongoose.Types.ObjectId(adminId), notes });

  const sellerStatusMap = {
    CONFIRMED: 'CONFIRMED', PROCESSING: 'PROCESSING',
    READY_FOR_SHIPMENT: 'READY_FOR_PICKUP', SHIPPED: 'IN_TRANSIT',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY', DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED', REFUNDED: 'REFUNDED',
  };

  if (sellerStatusMap[newStatus]) {
    for (const sellerOrder of order.sellerOrders) {
      sellerOrder.status = sellerStatusMap[newStatus];
      sellerOrder.statusHistory.push({ status: sellerStatusMap[newStatus], changedAt: new Date(), changedBy: new mongoose.Types.ObjectId(adminId), notes });
    }
  }

  await order.save();

  await AuditLog.create({
    userId: adminId, action: 'ORDER_STATUS_CHANGE', entity: 'Order', entityId: orderId,
    previousState: { status: prevStatus }, newState: { status: newStatus }, metadata: { notes },
  });

  await Notification.create({
    userId: order.userId, type: NotificationType.ORDER_UPDATE,
    title: `Order ${order.orderNumber} Updated`,
    message: `Your order status has been updated to: ${newStatus.replace(/_/g, ' ')}`,
    link: `/orders/${orderId}`,
    data: { orderId, orderNumber: order.orderNumber, newStatus },
  });

  return order;
}

async function cancelOrder(orderId, userId) {
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError('Order not found');
  if (order.userId.toString() !== userId) throw new ForbiddenError('Access denied');

  const cancellable = [OrderStatus.PENDING_PAYMENT, OrderStatus.CONFIRMED];
  if (!cancellable.includes(order.status)) throw new ValidationError('This order cannot be cancelled at this stage');

  order.status = OrderStatus.CANCELLED;
  order.statusHistory.push({ status: OrderStatus.CANCELLED, changedAt: new Date(), notes: 'Cancelled by customer' });

  for (const sellerOrder of order.sellerOrders) {
    for (const item of sellerOrder.items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stockQuantity: item.quantity, salesCount: -item.quantity } });
    }
  }

  await order.save();
  return order;
}

module.exports = { createFromCart, getMyOrders, getById, adminList, adminUpdateStatus, cancelOrder };
