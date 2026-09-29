import { Schema, model, Document, Types } from 'mongoose';

export interface IReview extends Document {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  orderId: Types.ObjectId;
  rating: number;
  title?: string;
  comment?: string;
  images: string[];
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  adminNotes?: string;
  helpfulCount: number;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 100 },
    comment: { type: String, maxlength: 2000 },
    images: [{ type: String }],
    isVerifiedPurchase: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    adminNotes: { type: String },
    helpfulCount: { type: Number, default: 0 },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// One review per product per user per order
reviewSchema.index({ productId: 1, userId: 1, orderId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, isApproved: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ isApproved: 1 });

export const Review = model<IReview>('Review', reviewSchema);
