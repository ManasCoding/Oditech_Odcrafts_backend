const { Schema, model } = require('mongoose');

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number },
    usageLimit: { type: Number },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    validFrom: { type: Date },
    validTo: { type: Date },
    description: { type: String },
  },
  { timestamps: true }
);


couponSchema.index({ isActive: 1, validTo: 1 });

const Coupon = model('Coupon', couponSchema);
module.exports = { Coupon };
