import mongoose, { Schema, Document } from 'mongoose'

export interface IHallOfFameItem extends Document {
  title: string
  achieverName: string
  userRef?: mongoose.Types.ObjectId
  role: string
  category: 'Hackathon' | 'Academic Exellence' | 'Placement Star' | 'Research Paper' | 'Alumni Milestone'
  department: string
  batch: string
  achievementDate: Date
  description: string
  awardName: string
  imageUrl?: string
  createdAt: Date
  updatedAt: Date
}

const HallOfFameItemSchema = new Schema<IHallOfFameItem>(
  {
    title: { type: String, required: true },
    achieverName: { type: String, required: true },
    userRef: { type: Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, default: 'Student' },
    category: {
      type: String,
      enum: ['Hackathon', 'Academic Exellence', 'Placement Star', 'Research Paper', 'Alumni Milestone'],
      default: 'Academic Exellence',
    },
    department: { type: String, default: 'Computer Science' },
    batch: { type: String, default: '2026' },
    achievementDate: { type: Date, default: Date.now },
    description: { type: String, required: true },
    awardName: { type: String, default: 'Gold Medal' },
    imageUrl: { type: String },
  },
  { timestamps: true }
)

export default mongoose.model<IHallOfFameItem>('HallOfFameItem', HallOfFameItemSchema)
