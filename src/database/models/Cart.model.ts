import { Schema, model, Document, Types } from 'mongoose';

export interface ICartItem {
  productId: Types.ObjectId;
  productName: string;
  productSlug: string;
  productImage?: string;
  sellerId: Types.ObjectId;
  sellerName?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  stockQuantity: number;
  savedForLater: boolean;
  addedAt: Date;
}

export interface ICart extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  items: ICartItem[];
  updatedAt: Date;
  createdAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    productSlug: { type: String, required: true },
    productImage: { type: String },
    sellerId: { type: Schema.Types.ObjectId, ref: 'SellerProfile', required: true },
    sellerName: { type: String },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0 },
    savedForLater: { type: Boolean, default: false },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const cartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

export const Cart = model<ICart>('Cart', cartSchema);
