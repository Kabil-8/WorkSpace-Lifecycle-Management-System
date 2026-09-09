import mongoose, { Schema, Document } from 'mongoose'

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId
  title: string
  message: string
  type: 'assignment' | 'attendance' | 'exam' | 'placement' | 'gamification' | 'system' | 'forum' | 'leave' | 'event' | 'general'
  isRead: boolean
  readAt?: Date
  actionUrl?: string
  actionLabel?: string
  icon?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  metadata?: Record<string, any>
  expiresAt?: Date
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>({
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
}, { timestamps: true })

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 })

export default mongoose.model<INotification>('Notification', NotificationSchema)
