import mongoose, { Schema, Document } from 'mongoose'

export interface ILeaveRequest extends Document {
  applicantId: mongoose.Types.ObjectId
  applicantName: string
  classTeacherId?: mongoose.Types.ObjectId
  classTeacherName?: string
  role: 'student' | 'faculty'
  department: string
  leaveType: 'Medical' | 'OD' | 'Personal' | 'Casual' | 'Vacation' | 'Emergency'
  startDate: Date
  endDate: Date
  reason: string
  status: 'Pending' | 'Approved' | 'Rejected'
  reviewedBy?: string
  comments?: string
  createdAt: Date
  updatedAt: Date
}

const LeaveRequestSchema = new Schema<ILeaveRequest>(
  {
    applicantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    applicantName: { type: String, required: true },
    classTeacherId: { type: Schema.Types.ObjectId, ref: 'User' },
    classTeacherName: { type: String, default: 'Class Teacher' },
    role: { type: String, enum: ['student', 'faculty'], default: 'student' },
    department: { type: String, default: 'Computer Science' },
    leaveType: { type: String, enum: ['Medical', 'OD', 'Personal', 'Casual', 'Vacation', 'Emergency'], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    reviewedBy: { type: String, default: '' },
    comments: { type: String, default: '' },
  },
  { timestamps: true }
)

export const LeaveRequest = mongoose.model<ILeaveRequest>('LeaveRequest', LeaveRequestSchema)
