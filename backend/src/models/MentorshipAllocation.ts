import mongoose, { Schema, Document } from 'mongoose'

export interface IMentorshipAllocation extends Document {
  studentId: mongoose.Types.ObjectId
  studentName: string
  mentorId: mongoose.Types.ObjectId
  mentorName: string
  mentorRole: string
  allocatedBy: mongoose.Types.ObjectId
  allocatedByName: string
  topic?: string
  status: 'active' | 'completed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

const MentorshipAllocationSchema = new Schema<IMentorshipAllocation>({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  studentName: { type: String, required: true },
  mentorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  mentorName: { type: String, required: true },
  mentorRole: { type: String, default: 'mentor' },
  allocatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  allocatedByName: { type: String, required: true },
  topic: { type: String, default: 'Academic & Career Growth' },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
}, { timestamps: true })

export default mongoose.model<IMentorshipAllocation>('MentorshipAllocation', MentorshipAllocationSchema)
