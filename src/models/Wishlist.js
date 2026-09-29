const { Schema, model } = require('mongoose');

const wishlistItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    productSlug: { type: String, required: true },
    productImage: { type: String },
    sellingPrice: { type: Number, required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'SellerProfile', required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const wishlistSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [wishlistItemSchema],
  },
  { timestamps: true }
);

wishlistSchema.index({ 'items.productId': 1 });

const Wishlist = model('Wishlist', wishlistSchema);
module.exports = { Wishlist };
