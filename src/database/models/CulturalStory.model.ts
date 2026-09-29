import { Schema, model, Document, Types } from 'mongoose';

export interface ICulturalStory extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  heroImage: string;
  images: string[];
  authorName?: string;
  authorId?: Types.ObjectId;
  relatedArtisanId?: Types.ObjectId;
  relatedProductIds: Types.ObjectId[];
  relatedCraftId?: Types.ObjectId;
  readTimeMinutes: number;
  isFeatured: boolean;
  isPublished: boolean;
  publishedAt?: Date;
  tags: string[];
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const culturalStorySchema = new Schema<ICulturalStory>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['artisan-stories', 'craft-stories', 'odisha-culture', 'making-process', 'heritage', 'traditions'],
    },
    excerpt: { type: String, required: true, maxlength: 500 },
    content: { type: String, required: true },
    heroImage: { type: String, required: true },
    images: [{ type: String }],
    authorName: { type: String },
    authorId: { type: Schema.Types.ObjectId, ref: 'User' },
    relatedArtisanId: { type: Schema.Types.ObjectId, ref: 'SellerProfile' },
    relatedProductIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    relatedCraftId: { type: Schema.Types.ObjectId, ref: 'Craft' },
    readTimeMinutes: { type: Number, default: 5 },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    tags: [{ type: String, lowercase: true, trim: true }],
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

culturalStorySchema.index({ isPublished: 1, isFeatured: 1 });
culturalStorySchema.index({ isPublished: 1, category: 1 });
culturalStorySchema.index({ isPublished: 1, publishedAt: -1 });
culturalStorySchema.index({ tags: 1 });
culturalStorySchema.index({ title: 'text', excerpt: 'text', content: 'text' });

export const CulturalStory = model<ICulturalStory>('CulturalStory', culturalStorySchema);
