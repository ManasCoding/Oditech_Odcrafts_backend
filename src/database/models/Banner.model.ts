import { Schema, model, Document, Types } from 'mongoose';

export interface IBanner extends Document {
  _id: Types.ObjectId;
  title?: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  cta?: string;
  placement: string;
  isActive: boolean;
  sortOrder: number;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>(
  {
    title: { type: String },
    subtitle: { type: String },
    imageUrl: { type: String, required: true },
    linkUrl: { type: String },
    cta: { type: String },
    placement: {
      type: String,
      default: 'homepage',
      enum: ['homepage', 'shop', 'category', 'sidebar'],
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

bannerSchema.index({ isActive: 1, placement: 1, sortOrder: 1 });

export const Banner = model<IBanner>('Banner', bannerSchema);
