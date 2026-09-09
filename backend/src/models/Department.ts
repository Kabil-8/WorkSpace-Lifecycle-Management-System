import mongoose, { Schema, Document } from 'mongoose'

export interface IDepartment extends Document {
  name: string
  code: string
  hodId?: mongoose.Types.ObjectId
  hodName?: string
  facultyCount: number
  studentCount: number
  courseCount: number
  description?: string
  established?: number
  building?: string
  email?: string
  phone?: string
  createdAt: Date
}

const DepartmentSchema = new Schema<IDepartment>({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  hodId: { type: Schema.Types.ObjectId, ref: 'User' },
  hodName: { type: String },
  facultyCount: { type: Number, default: 0 },
  studentCount: { type: Number, default: 0 },
  courseCount: { type: Number, default: 0 },
  description: { type: String },
  established: { type: Number },
  building: { type: String },
  email: { type: String },
  phone: { type: String },
}, { timestamps: true })

export default mongoose.model<IDepartment>('Department', DepartmentSchema)
