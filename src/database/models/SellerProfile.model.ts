import { Schema, model, Document, Types } from 'mongoose';

export enum SellerStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CHANGES_REQUIRED = 'CHANGES_REQUIRED',
  SUSPENDED = 'SUSPENDED',
}

export interface ISellerProfile extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  craftType?: string;
  yearsOfExperience?: number;
  artisanStory?: string;
  skills: string[];
  productsCreated?: number;
  traditionalTechnique?: string;
  slug: string;
  photo?: string;
  district?: string;
  state?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIFSC?: string;
  bankName?: string;
  businessName?: string;
  businessRegistration?: string;
  gstin?: string;
  panNumber?: string;
  shippingPreference?: string;
  status: SellerStatus;
  adminNotes?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  suspendedAt?: Date;
  totalProducts: number;
  totalSales: number;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const sellerProfileSchema = new Schema<ISellerProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    craftType: { type: String, trim: true },
    yearsOfExperience: { type: Number, min: 0 },
    artisanStory: { type: String },
    skills: [{ type: String, trim: true }],
    productsCreated: { type: Number, min: 0 },
    traditionalTechnique: { type: String },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    photo: { type: String },
    district: { type: String, trim: true },
    state: { type: String, trim: true, default: 'Odisha' },
    bankAccountName: { type: String },
    bankAccountNumber: { type: String },
    bankIFSC: { type: String },
    bankName: { type: String },
    businessName: { type: String },
    businessRegistration: { type: String },
    gstin: { type: String },
    panNumber: { type: String },
    shippingPreference: { type: String },
    status: {
      type: String,
      enum: Object.values(SellerStatus),
      default: SellerStatus.PENDING,
    },
    adminNotes: { type: String },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    suspendedAt: { type: Date },
    totalProducts: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

sellerProfileSchema.index({ status: 1 });
sellerProfileSchema.index({ craftType: 1 });
sellerProfileSchema.index({ district: 1 });

export const SellerProfile = model<ISellerProfile>('SellerProfile', sellerProfileSchema);
