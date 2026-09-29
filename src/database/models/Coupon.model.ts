import { Schema, model, Document, Types } from 'mongoose';

export interface ICoupon extends Document {
  _id: Types.ObjectId;
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom?: Date;
  validUntil?: Date;
  isActive: boolean;
  applicableCategories: Types.ObjectId[];
  usedByUsers: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String },
    discountType: { type: String, enum: ['PERCENTAGE', 'FIXED'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minimumOrderAmount: { type: Number, min: 0 },
    maximumDiscount: { type: Number, min: 0 },
    usageLimit: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0 },
    validFrom: { type: Date },
    validUntil: { type: Date },
    isActive: { type: Boolean, default: true },
    applicableCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    usedByUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

couponSchema.index({ isActive: 1, validUntil: 1 });

export const Coupon = model<ICoupon>('Coupon', couponSchema);
