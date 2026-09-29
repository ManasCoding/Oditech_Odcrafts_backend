const { Schema, model } = require('mongoose');

const cartItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    productSlug: { type: String },
    productImage: { type: String },
    sellerId: { type: Schema.Types.ObjectId, ref: 'SellerProfile', required: true },
    sellerName: { type: String },
    sku: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    stockQuantity: { type: Number },
    savedForLater: { type: Boolean, default: false },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const cartSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

const Cart = model('Cart', cartSchema);
module.exports = { Cart };
