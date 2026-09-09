import mongoose, { Schema, Document } from 'mongoose'

export interface IStudentAttendance extends Document {
  studentId: mongoose.Types.ObjectId
  studentName: string
  rollNo: string
  subject: string
  department: string
  date: Date
  status: 'Present' | 'Absent' | 'Late' | 'Excused' | 'Medical Leave'
  method: 'QR' | 'Face' | 'RFID' | 'OTP' | 'GeoLocation' | 'Manual' | 'Manual Grid' | 'Biometric'
  remarks?: string
  createdAt: Date
  updatedAt: Date
}

const StudentAttendanceSchema = new Schema<IStudentAttendance>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentName: { type: String, required: true },
    rollNo: { type: String, required: true },
    subject: { type: String, required: true, index: true },
    department: { type: String, default: 'Computer Science & Engineering' },
    date: { type: Date, default: Date.now, index: true },
    status: { type: String, enum: ['Present', 'Absent', 'Late', 'Excused', 'Medical Leave', 'present', 'absent', 'late'], default: 'Present', index: true },
    method: { type: String, default: 'Manual' },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
)

StudentAttendanceSchema.index({ studentId: 1, date: -1 })
StudentAttendanceSchema.index({ studentId: 1, status: 1 })

export const StudentAttendance = mongoose.models.StudentAttendance
  || mongoose.model<IStudentAttendance>('StudentAttendance', StudentAttendanceSchema)
