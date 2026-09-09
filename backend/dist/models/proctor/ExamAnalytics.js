import mongoose, { Schema } from 'mongoose';
const ExamAnalyticsSchema = new Schema({
    department: { type: String, required: true, default: 'Computer Science' },
    totalExamsConducted: { type: Number, default: 12 },
    totalStudentsAssessed: { type: Number, default: 480 },
    averageIntegrityScore: { type: Number, default: 89.4 },
    safeCount: { type: Number, default: 390 },
    lowRiskCount: { type: Number, default: 52 },
    moderateRiskCount: { type: Number, default: 24 },
    suspiciousCount: { type: Number, default: 10 },
    highRiskCount: { type: Number, default: 4 },
    topViolations: [{ violationType: String, count: Number }],
    monthlyStats: [{ month: String, avgIntegrity: Number, totalExams: Number }],
}, { timestamps: true });
export const ExamAnalytics = mongoose.model('ExamAnalytics', ExamAnalyticsSchema);
