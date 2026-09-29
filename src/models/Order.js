const { Schema, model } = require('mongoose');

const OrderStatus = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  READY_FOR_SHIPMENT: 'READY_FOR_SHIPMENT',
  SHIPPED: 'SHIPPED',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  RETURN_REQUESTED: 'RETURN_REQUESTED',
  RETURNED: 'RETURNED',
  REFUNDED: 'REFUNDED',
};

const SellerOrderStatus = {
  AWAITING_FULFILLMENT: 'AWAITING_FULFILLMENT',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  IN_TRANSIT: 'IN_TRANSIT',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  RETURNED: 'RETURNED',
  REFUNDED: 'REFUNDED',
};

const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
};

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    productSlug: { type: String },
    productSku: { type: String },
    productImage: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    basePrice: { type: Number },
    totalPrice: { type: Number, required: true },
    district: { type: String },
    isReviewed: { type: Boolean, default: false },
  },
  { timestamps: false }
);

const statusHistorySchema = new Schema(
  {
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  { _id: false }
);

const sellerOrderSchema = new Schema(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'SellerProfile', required: true },
    sellerName: { type: String, required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    shippingCharge: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, required: true, default: 0 },
    sellerEarning: { type: Number, required: true, default: 0 },
    platformCommission: { type: Number, required: true, default: 0 },
    profitShare: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: Object.values(SellerOrderStatus),
      default: SellerOrderStatus.AWAITING_FULFILLMENT,
    },
    trackingNumber: { type: String },
    trackingUrl: { type: String },
    estimatedDelivery: { type: Date },
    adminNotes: { type: String },
    statusHistory: [statusHistorySchema],
  },
  { timestamps: true }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    addressSnapshot: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true },
      district: { type: String },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: 'India' },
    },
    sellerOrders: [sellerOrderSchema],
    subtotal: { type: Number, required: true, min: 0 },
    shippingTotal: { type: Number, required: true, default: 0 },
    taxTotal: { type: Number, required: true, default: 0 },
    discountTotal: { type: Number, required: true, default: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING_PAYMENT,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    paymentMethod: { type: String },
    paymentProvider: { type: String },
    providerOrderId: { type: String },
    providerPaymentId: { type: String },
    couponCode: { type: String },
    couponDiscount: { type: Number, default: 0 },
    notes: { type: String },
    statusHistory: [statusHistorySchema],
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ 'sellerOrders.sellerId': 1 });
orderSchema.index({ createdAt: -1 });

const Order = model('Order', orderSchema);
module.exports = { Order, OrderStatus, SellerOrderStatus, PaymentStatus };
