import { Schema, model, Document, Types } from 'mongoose';

export interface IWishlistItem {
  productId: Types.ObjectId;
  productName: string;
  productSlug: string;
  productImage?: string;
  sellingPrice: number;
  sellerId: Types.ObjectId;
  addedAt: Date;
}

export interface IWishlist extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const wishlistItemSchema = new Schema<IWishlistItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    productSlug: { type: String, required: true },
    productImage: { type: String },
    sellingPrice: { type: Number, required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'SellerProfile', required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const wishlistSchema = new Schema<IWishlist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [wishlistItemSchema],
  },
  { timestamps: true }
);

wishlistSchema.index({ 'items.productId': 1 });

export const Wishlist = model<IWishlist>('Wishlist', wishlistSchema);
