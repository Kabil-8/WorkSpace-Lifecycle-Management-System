import mongoose, { Schema, Document } from 'mongoose'

export interface ISystemSetting extends Document {
  siteName: string
  metaDescription: string
  metaKeywords: string
  edenSyncStatus: string
  themeColor: string
  maintenanceMode: boolean
  allowRegistration: boolean
  maxLoginAttempts: number
  proctoringSensitivity: 'low' | 'medium' | 'high' | 'strict'
  aiCopilotEnabled: boolean
  defaultUserRole: string
  smtpHost?: string
  smtpPort?: number
  updatedBy?: string
  updatedAt: Date
}

const SystemSettingSchema = new Schema<ISystemSetting>({
  siteName: { type: String, default: 'EduSphere — AI-Powered Academic Operating System' },
  metaDescription: { type: String, default: 'EduSphere — AI-Powered Student Lifecycle Management Ecosystem. The most advanced educational SaaS platform for universities worldwide.' },
  metaKeywords: { type: String, default: 'education, AI, academic OS, university, learning, LMS, placement' },
  edenSyncStatus: { type: String, default: 'EDEN AI Neural Network Active & Synced' },
  themeColor: { type: String, default: '#09090B' },
  maintenanceMode: { type: Boolean, default: false },
  allowRegistration: { type: Boolean, default: true },
  maxLoginAttempts: { type: Number, default: 5 },
  proctoringSensitivity: { type: String, enum: ['low', 'medium', 'high', 'strict'], default: 'high' },
  aiCopilotEnabled: { type: Boolean, default: true },
  defaultUserRole: { type: String, default: 'student' },
  smtpHost: { type: String, default: 'smtp.edusphere.ai' },
  smtpPort: { type: Number, default: 587 },
  updatedBy: { type: String, default: 'Admin' },
}, { timestamps: true })

export default mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema)
