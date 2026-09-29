const { Schema, model } = require('mongoose');

const NotificationType = {
  ORDER_UPDATE: 'ORDER_UPDATE',
  PAYMENT: 'PAYMENT',
  PROMOTION: 'PROMOTION',
  SYSTEM: 'SYSTEM',
  SELLER_UPDATE: 'SELLER_UPDATE',
};

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    data: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

const Notification = model('Notification', notificationSchema);
module.exports = { Notification, NotificationType };
