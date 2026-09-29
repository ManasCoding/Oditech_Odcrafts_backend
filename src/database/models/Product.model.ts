import { Schema, model, Document, Types } from 'mongoose';

export enum ProductStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  PUBLISHED = 'PUBLISHED',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  SUSPENDED = 'SUSPENDED',
}

export interface IProductImage {
  url: string;
  alt?: string;
  isPrimary: boolean;
  sortOrder: number;
  storageKey?: string;
}

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  shortDescription?: string;
  description: string;
  sellerId: Types.ObjectId;
  categoryId: Types.ObjectId;
  subcategoryId?: Types.ObjectId;
  craftId: Types.ObjectId;
  district?: string;
  materials: string[];
  dimensions?: string;
  weight?: string;
  color?: string;
  sku: string;
  basePrice: number;
  sellingPrice: number;
  images: IProductImage[];
  videoUrl?: string;
  isHandmade: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  status: ProductStatus;
  publishedAt?: Date;
  // Inventory (embedded for performance)
  stockQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  // Aggregated stats
  rating: number;
  reviewCount: number;
  salesCount: number;
  // Financial
  commissionRate?: number;
  profitShareRate?: number;
  shippingCategory?: string;
  adminNotes?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const productImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true },
    alt: { type: String },
    isPrimary: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    storageKey: { type: String },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortDescription: { type: String, maxlength: 300 },
    description: { type: String, required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'SellerProfile', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    craftId: { type: Schema.Types.ObjectId, ref: 'Craft', required: true },
    district: { type: String, trim: true },
    materials: [{ type: String, trim: true }],
    dimensions: { type: String },
    weight: { type: String },
    color: { type: String },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    basePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    images: [productImageSchema],
    videoUrl: { type: String },
    isHandmade: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: true },
    status: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.DRAFT,
    },
    publishedAt: { type: Date },
    // Inventory embedded for atomic operations
    stockQuantity: { type: Number, default: 0, min: 0 },
    reservedQuantity: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    // Aggregated stats
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    salesCount: { type: Number, default: 0 },
    // Financial
    commissionRate: { type: Number },
    profitShareRate: { type: Number },
    shippingCategory: { type: String },
    adminNotes: { type: String },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// Compound indexes for shop filtering
productSchema.index({ sellerId: 1, status: 1 });
productSchema.index({ categoryId: 1, status: 1 });
productSchema.index({ craftId: 1, status: 1 });
productSchema.index({ status: 1, isFeatured: 1 });
productSchema.index({ status: 1, isBestseller: 1 });
productSchema.index({ status: 1, isNewArrival: 1 });
productSchema.index({ status: 1, sellingPrice: 1 });
productSchema.index({ status: 1, rating: -1 });
productSchema.index({ status: 1, salesCount: -1 });
productSchema.index({ district: 1, status: 1 });
productSchema.index({ deletedAt: 1 });
// Text search
productSchema.index({ name: 'text', shortDescription: 'text', description: 'text' });

export const Product = model<IProduct>('Product', productSchema);
