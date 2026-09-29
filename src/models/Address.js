const { Schema, model } = require('mongoose');

const addressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, default: 'India' },
    isDefault: { type: Boolean, default: false },
    addressType: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
  },
  { timestamps: true }
);

addressSchema.index({ userId: 1, isDefault: -1 });

const Address = model('Address', addressSchema);
module.exports = { Address };
