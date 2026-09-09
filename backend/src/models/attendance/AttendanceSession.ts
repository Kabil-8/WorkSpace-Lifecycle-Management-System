import mongoose, { Schema, Document } from 'mongoose'

export interface IAttendanceSession extends Document {
  subject: string
  department: string
  facultyId: mongoose.Types.ObjectId
  facultyName: string
  qrToken: string
  otpCode: string
  date: Date
  isActive: boolean
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

const AttendanceSessionSchema = new Schema<IAttendanceSession>(
  {
    subject: { type: String, required: true },
    department: { type: String, default: 'Computer Science' },
    facultyId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    facultyName: { type: String, required: true },
    qrToken: { type: String, required: true },
    otpCode: { type: String, required: true },
    date: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 60 * 1000) },
  },
  { timestamps: true }
)

export const AttendanceSession = mongoose.model<IAttendanceSession>('AttendanceSession', AttendanceSessionSchema)
