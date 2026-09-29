import { Schema, model, Document, Types } from 'mongoose';

export interface ICraft extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  origin?: string;
  technique?: string;
  materials: string[];
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const craftSchema = new Schema<ICraft>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String },
    image: { type: String },
    origin: { type: String, trim: true },
    technique: { type: String },
    materials: [{ type: String, trim: true }],
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

craftSchema.index({ isActive: 1 });

export const Craft = model<ICraft>('Craft', craftSchema);
