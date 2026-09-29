const { Schema, model } = require('mongoose');

const culturalStorySchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: String, required: true },
    excerpt: { type: String },
    content: { type: String, required: true },
    heroImage: { type: String },
    tags: [{ type: String }],
    relatedArtisanId: { type: Schema.Types.ObjectId, ref: 'SellerProfile' },
    relatedProductIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    relatedCraftId: { type: Schema.Types.ObjectId, ref: 'Craft' },
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    publishedAt: { type: Date },
    readTimeMinutes: { type: Number, default: 5 },
    viewCount: { type: Number, default: 0 },
    author: { type: String },
  },
  { timestamps: true }
);


culturalStorySchema.index({ isPublished: 1, isFeatured: 1, publishedAt: -1 });
culturalStorySchema.index({ category: 1, isPublished: 1 });

const CulturalStory = model('CulturalStory', culturalStorySchema);
module.exports = { CulturalStory };
