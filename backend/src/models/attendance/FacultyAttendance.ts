import mongoose, { Schema, Document } from 'mongoose'

export interface IFacultyAttendance extends Document {
  facultyId: mongoose.Types.ObjectId
  facultyName: string
  department: string
  date: Date
  checkInTime: string
  checkOutTime?: string
  totalWorkingHours: number
  status: 'Present' | 'Late' | 'Leave' | 'Permission'
  checkInMethod: 'Face' | 'Fingerprint' | 'QR' | 'Manual' | 'RFID'
  punctualityScore: number
  createdAt: Date
  updatedAt: Date
}

const FacultyAttendanceSchema = new Schema<IFacultyAttendance>(
  {
    facultyId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    facultyName: { type: String, required: true },
    department: { type: String, default: 'Computer Science' },
    date: { type: Date, default: Date.now },
    checkInTime: { type: String, required: true },
    checkOutTime: { type: String, default: '17:00' },
    totalWorkingHours: { type: Number, default: 8.5 },
    status: { type: String, enum: ['Present', 'Late', 'Leave', 'Permission'], default: 'Present' },
    checkInMethod: { type: String, enum: ['Face', 'Fingerprint', 'QR', 'Manual', 'RFID'], default: 'Face' },
    punctualityScore: { type: Number, default: 95 },
  },
  { timestamps: true }
)

export const FacultyAttendance = mongoose.model<IFacultyAttendance>('FacultyAttendance', FacultyAttendanceSchema)
