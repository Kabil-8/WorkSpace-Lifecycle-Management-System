import mongoose, { Schema, Document } from 'mongoose'

export type ApplicationStatus =
  | 'APPLIED'
  | 'SCREENED'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'SELECTED'
  | 'OFFERED'
  | 'JOINED'
  | 'REJECTED'
  | 'WITHDRAWN'

interface IStatusHistory {
  status: ApplicationStatus
  changedAt: Date
  changedBy?: mongoose.Types.ObjectId
  note?: string
}

export interface IJobApplication extends Document {
  jobId: mongoose.Types.ObjectId
  studentId: mongoose.Types.ObjectId
  recruiterId: mongoose.Types.ObjectId
  status: ApplicationStatus
  atsScore?: number
  resumeUrl?: string
  coverLetter?: string
  appliedAt: Date
  statusHistory: IStatusHistory[]
  interviewDate?: Date
  offerAmount?: string
  offerDeadline?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const StatusHistorySchema = new Schema<IStatusHistory>({
  status: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  note: { type: String },
}, { _id: false })

const JobApplicationSchema = new Schema<IJobApplication>({
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  recruiterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['APPLIED', 'SCREENED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'OFFERED', 'JOINED', 'REJECTED', 'WITHDRAWN'],
    default: 'APPLIED',
    index: true,
  },
  atsScore: { type: Number },
  resumeUrl: { type: String },
  coverLetter: { type: String },
  appliedAt: { type: Date, default: Date.now },
  statusHistory: [StatusHistorySchema],
  interviewDate: { type: Date },
  offerAmount: { type: String },
  offerDeadline: { type: Date },
  notes: { type: String },
}, { timestamps: true })

JobApplicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true })
JobApplicationSchema.index({ recruiterId: 1, status: 1 })
JobApplicationSchema.index({ studentId: 1, status: 1 })

export const JobApplication = mongoose.models.JobApplication
  || mongoose.model<IJobApplication>('JobApplication', JobApplicationSchema)


// ─── Placement Drive ──────────────────────────────────────────────────────────
export interface IPlacementDrive extends Document {
  companyName: string
  companyLogo?: string
  role: string
  package: string
  jobType: 'full_time' | 'internship' | 'contract'
  eligibility: {
    minCGPA: number
    branches: string[]
    skills: string[]
    graduationYear?: number
    backlogs: number
  }
  driveDate: Date
  applicationDeadline: Date
  status: 'upcoming' | 'active' | 'completed' | 'cancelled'
  location: string
  description: string
  rounds: string[]
  placementOfficerId: mongoose.Types.ObjectId
  totalApplicants?: number
  totalSelected?: number
  createdAt: Date
  updatedAt: Date
}

const PlacementDriveSchema = new Schema<IPlacementDrive>({
  companyName: { type: String, required: true, index: true },
  companyLogo: { type: String },
  role: { type: String, required: true },
  package: { type: String, required: true },
  jobType: { type: String, enum: ['full_time', 'internship', 'contract'], default: 'full_time' },
  eligibility: {
    minCGPA: { type: Number, default: 6.0 },
    branches: [{ type: String }],
    skills: [{ type: String }],
    graduationYear: { type: Number },
    backlogs: { type: Number, default: 0 },
  },
  driveDate: { type: Date, required: true },
  applicationDeadline: { type: Date, required: true },
  status: { type: String, enum: ['upcoming', 'active', 'completed', 'cancelled'], default: 'upcoming' },
  location: { type: String, default: 'On Campus' },
  description: { type: String, default: '' },
  rounds: [{ type: String }],
  placementOfficerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  totalApplicants: { type: Number, default: 0 },
  totalSelected: { type: Number, default: 0 },
}, { timestamps: true })

PlacementDriveSchema.index({ status: 1, driveDate: 1 })

export const PlacementDrive = mongoose.models.PlacementDrive
  || mongoose.model<IPlacementDrive>('PlacementDrive', PlacementDriveSchema)
