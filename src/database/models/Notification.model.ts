import { Schema, model, Document, Types } from 'mongoose';

export enum NotificationType {
  INFO = 'INFO',
  ALERT = 'ALERT',
  ORDER_UPDATE = 'ORDER_UPDATE',
  PAYMENT_UPDATE = 'PAYMENT_UPDATE',
  SELLER_UPDATE = 'SELLER_UPDATE',
  SYSTEM = 'SYSTEM',
}

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  link?: string;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    link: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
// Auto-expire old notifications after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export const Notification = model<INotification>('Notification', notificationSchema);
