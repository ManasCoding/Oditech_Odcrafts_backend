import { Schema, model, Document, Types } from 'mongoose';

export interface ISellerWallet extends Document {
  _id: Types.ObjectId;
  sellerId: Types.ObjectId;
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  totalPaidOut: number;
  createdAt: Date;
  updatedAt: Date;
}

const sellerWalletSchema = new Schema<ISellerWallet>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'SellerProfile', required: true, unique: true },
    availableBalance: { type: Number, default: 0, min: 0 },
    pendingBalance: { type: Number, default: 0, min: 0 },
    totalEarned: { type: Number, default: 0, min: 0 },
    totalPaidOut: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const SellerWallet = model<ISellerWallet>('SellerWallet', sellerWalletSchema);
