import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  action: string;
  entity: string;
  entityId: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String, required: true },
    previousState: { type: Schema.Types.Mixed },
    newState: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ createdAt: -1 });
// Keep audit logs for 1 year
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
