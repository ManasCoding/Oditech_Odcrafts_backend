const { Schema, model } = require('mongoose');

const sellerWalletSchema = new Schema(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'SellerProfile', required: true, unique: true },
    availableBalance: { type: Number, default: 0, min: 0 },
    pendingBalance: { type: Number, default: 0, min: 0 },
    totalEarned: { type: Number, default: 0, min: 0 },
    totalPaidOut: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

const SellerWallet = model('SellerWallet', sellerWalletSchema);
module.exports = { SellerWallet };
