import mongoose, { Schema } from 'mongoose';
const NotificationSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ['assignment', 'attendance', 'exam', 'placement', 'gamification', 'system', 'forum', 'leave', 'event', 'general'],
        default: 'general',
    },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    actionUrl: { type: String },
    actionLabel: { type: String },
    icon: { type: String },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    metadata: { type: Schema.Types.Mixed },
    expiresAt: { type: Date },
}, { timestamps: true });
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
export default mongoose.model('Notification', NotificationSchema);
