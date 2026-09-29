const { Schema, model } = require('mongoose');

const craftSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String },
    image: { type: String },
    origin: { type: String },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);


craftSchema.index({ isActive: 1, sortOrder: 1 });

const Craft = model('Craft', craftSchema);
module.exports = { Craft };
