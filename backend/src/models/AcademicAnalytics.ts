import mongoose, { Schema, Document } from 'mongoose'

export interface IAcademicAnalytics extends Document {
  department: string
  academicYear: string
  retentionRatePct: number
  graduationRatePct: number
  placementRatePct: number
  avgCgpa: number
  totalRevenueUsd: number
  enrolledStudentsCount: number
  activeFacultyCount: number
  monthlyEnrollments: { month: string; studentsCount: number; revenue: number }[]
  createdAt: Date
  updatedAt: Date
}

const AcademicAnalyticsSchema = new Schema<IAcademicAnalytics>(
  {
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
  },
  { timestamps: true }
)

export default mongoose.model<IAcademicAnalytics>('AcademicAnalytics', AcademicAnalyticsSchema)
