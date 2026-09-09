import mongoose, { Schema, Document } from 'mongoose'

export interface IJob extends Document {
  title: string
  company: string
  companyLogo?: string
  location: string
  locationType: 'on-site' | 'remote' | 'hybrid'
  type: 'full-time' | 'part-time' | 'internship' | 'contract'
  salary: string
  salaryMin?: number
  salaryMax?: number
  description: string
  applyUrl?: string
  requirements: string[]
  skills: string[]
  postedById: mongoose.Types.ObjectId
  postedByName: string
  deadline: Date
  applicants: {
    userId: mongoose.Types.ObjectId
    appliedAt: Date
    status: 'applied' | 'reviewed' | 'shortlisted' | 'rejected' | 'offered'
  }[]
  isActive: boolean
  experienceLevel: 'fresher' | 'junior' | 'mid' | 'senior' | 'lead'
  domain: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

const JobSchema = new Schema<IJob>({
  title: { type: String, required: true, index: true },
  company: { type: String, required: true },
  companyLogo: { type: String },
  location: { type: String, required: true },
  locationType: { type: String, enum: ['on-site', 'remote', 'hybrid'], default: 'on-site' },
  type: { type: String, enum: ['full-time', 'part-time', 'internship', 'contract'], default: 'full-time' },
  salary: { type: String, default: 'Competitive' },
  salaryMin: { type: Number },
  salaryMax: { type: Number },
  description: { type: String, default: '' },
  applyUrl: { type: String },
  requirements: [{ type: String }],
  skills: [{ type: String }],
  postedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  postedByName: { type: String, required: true },
  deadline: { type: Date, required: true },
  applicants: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    appliedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['applied', 'reviewed', 'shortlisted', 'rejected', 'offered'], default: 'applied' },
  }],
  isActive: { type: Boolean, default: true },
  experienceLevel: { type: String, enum: ['fresher', 'junior', 'mid', 'senior', 'lead'], default: 'fresher' },
  domain: { type: String, default: 'Technology' },
  tags: [{ type: String }],
}, { timestamps: true })

JobSchema.index({ title: 'text', company: 'text', description: 'text', skills: 'text' })

export default mongoose.model<IJob>('Job', JobSchema)
