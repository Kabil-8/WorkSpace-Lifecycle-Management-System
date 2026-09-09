import mongoose, { Schema } from 'mongoose';
const AuditLogSchema = new Schema({
    action: { type: String, required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    actorName: { type: String, default: 'System' },
    actorRole: { type: String, default: 'system' },
    description: { type: String, required: true },
    severity: { type: String, enum: ['info', 'warning', 'error', 'critical'], default: 'info' },
    ipAddress: { type: String },
    userAgent: { type: String },
    resourceType: { type: String },
    resourceId: { type: String },
    metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });
AuditLogSchema.index({ createdAt: -1 });
export default mongoose.model('AuditLog', AuditLogSchema);
