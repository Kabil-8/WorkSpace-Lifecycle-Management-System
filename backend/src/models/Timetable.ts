import mongoose, { Schema, Document } from 'mongoose'

export interface ITimetableItem extends Document {
  department: string
  semester: number
  section: string
  day: number // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat
  startPeriod: number
  duration: number
  subject: string
  room: string
  type: 'Lecture' | 'Lab' | 'Tutorial'
  color: string
  instructorId?: mongoose.Types.ObjectId
  instructorName?: string
  allocatedById?: mongoose.Types.ObjectId
  allocatedByName?: string
  createdAt: Date
  updatedAt: Date
}

const TimetableItemSchema = new Schema<ITimetableItem>({
  department: { type: String, required: true, index: true },
  semester: { type: Number, default: 7 },
  section: { type: String, default: 'Section A', index: true },
  day: { type: Number, required: true },
  startPeriod: { type: Number, required: true },
  duration: { type: Number, default: 1 },
  subject: { type: String, required: true },
  room: { type: String, required: true },
  type: { type: String, enum: ['Lecture', 'Lab', 'Tutorial'], default: 'Lecture' },
  color: { type: String, default: '#2563EB' },
  instructorId: { type: Schema.Types.ObjectId, ref: 'User' },
  instructorName: { type: String },
  allocatedById: { type: Schema.Types.ObjectId, ref: 'User' },
  allocatedByName: { type: String },
}, { timestamps: true })

TimetableItemSchema.index({ department: 1, semester: 1, section: 1, day: 1, startPeriod: 1 })

export default mongoose.model<ITimetableItem>('TimetableItem', TimetableItemSchema)
