import mongoose, { Schema } from 'mongoose';
const SystemSettingSchema = new Schema({
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
}, { timestamps: true });
export default mongoose.model('SystemSetting', SystemSettingSchema);
