import { Schema, model, Document, Types } from 'mongoose';

// ─── Enums ──────────────────────────────────────────────────────────────────

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  READY_FOR_SHIPMENT = 'READY_FOR_SHIPMENT',
  SHIPPED = 'SHIPPED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_CANCELLED = 'PARTIALLY_CANCELLED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum PaymentStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum SellerOrderStatus {
  AWAITING_FULFILLMENT = 'AWAITING_FULFILLMENT',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURN_REQUESTED = 'RETURN_REQUESTED',
  RETURNED = 'RETURNED',
  REFUNDED = 'REFUNDED',
}

// ─── Order Item ─────────────────────────────────────────────────────────────

export interface IOrderItem {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  productName: string;
  productSlug: string;
  productSku: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  basePrice: number;
  totalPrice: number;
  craftType?: string;
  district?: string;
  isReviewed: boolean;
}

// ─── Seller Sub-Order ────────────────────────────────────────────────────────

export interface ISellerOrder {
  _id: Types.ObjectId;
  sellerId: Types.ObjectId;
  sellerName: string;
  items: IOrderItem[];
  subtotal: number;
  shippingCharge: number;
  taxAmount: number;
  sellerEarning: number;
  platformCommission: number;
  profitShare: number;
  status: SellerOrderStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
  adminNotes?: string;
  statusHistory: Array<{
    status: SellerOrderStatus;
    changedAt: Date;
    changedBy?: Types.ObjectId;
    notes?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Master Order ────────────────────────────────────────────────────────────

export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string;
  userId: Types.ObjectId;
  addressSnapshot: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    district?: string;
    state: string;
    pincode: string;
    country: string;
  };
  sellerOrders: ISellerOrder[];
  subtotal: number;
  shippingTotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentProvider?: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  couponCode?: string;
  couponDiscount?: number;
  notes?: string;
  statusHistory: Array<{
    status: OrderStatus;
    changedAt: Date;
    changedBy?: Types.ObjectId;
    notes?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    productSlug: { type: String, required: true },
    productSku: { type: String, required: true },
    productImage: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    basePrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    craftType: { type: String },
    district: { type: String },
    isReviewed: { type: Boolean, default: false },
  },
  { timestamps: false }
);

const sellerOrderSchema = new Schema<ISellerOrder>(
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
    statusHistory: [
      {
        status: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        notes: { type: String },
      },
    ],
  },
  { timestamps: true }
);

const orderSchema = new Schema<IOrder>(
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
    statusHistory: [
      {
        status: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        notes: { type: String },
      },
    ],
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ 'sellerOrders.sellerId': 1 });
orderSchema.index({ createdAt: -1 });

export const Order = model<IOrder>('Order', orderSchema);
