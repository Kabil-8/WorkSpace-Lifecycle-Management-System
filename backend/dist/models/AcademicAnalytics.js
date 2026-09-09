import mongoose, { Schema } from 'mongoose';
const AcademicAnalyticsSchema = new Schema({
    department: { type: String, required: true },
    academicYear: { type: String, required: true },
    retentionRatePct: { type: Number, default: null },
    graduationRatePct: { type: Number, default: null },
    placementRatePct: { type: Number, default: null },
    avgCgpa: { type: Number, default: null },
    totalRevenueUsd: { type: Number, default: null },
    enrolledStudentsCount: { type: Number, default: null },
    activeFacultyCount: { type: Number, default: null },
    monthlyEnrollments: [
        {
            month: { type: String },
            studentsCount: { type: Number },
            revenue: { type: Number },
        },
    ],
}, { timestamps: true });
export default mongoose.model('AcademicAnalytics', AcademicAnalyticsSchema);
