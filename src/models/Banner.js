const { Schema, model } = require('mongoose');

const bannerSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String },
    imageUrl: { type: String, required: true },
    linkUrl: { type: String },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    placement: { type: String, default: 'home' },
    validFrom: { type: Date },
    validTo: { type: Date },
  },
  { timestamps: true }
);

bannerSchema.index({ isActive: 1, sortOrder: 1 });

const Banner = model('Banner', bannerSchema);
module.exports = { Banner };
