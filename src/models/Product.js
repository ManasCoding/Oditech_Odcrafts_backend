const { Schema, model } = require('mongoose');

const ProductStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
  PUBLISHED: 'PUBLISHED',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  SUSPENDED: 'SUSPENDED',
};

const productImageSchema = new Schema(
  {
    url: { type: String, required: true },
    alt: { type: String },
    isPrimary: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    storageKey: { type: String },
  },
  { _id: false }
);

const productSchema = new Schema(
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
    status: { type: String, enum: Object.values(ProductStatus), default: ProductStatus.DRAFT },
    publishedAt: { type: Date },
    stockQuantity: { type: Number, default: 0, min: 0 },
    reservedQuantity: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    salesCount: { type: Number, default: 0 },
    commissionRate: { type: Number },
    profitShareRate: { type: Number },
    shippingCategory: { type: String },
    adminNotes: { type: String },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

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
productSchema.index({ name: 'text', shortDescription: 'text', description: 'text' });

const Product = model('Product', productSchema);
module.exports = { Product, ProductStatus };
