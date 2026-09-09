import mongoose, { Schema, Document } from 'mongoose'

export interface ISmartNote extends Document {
  userId: mongoose.Types.ObjectId
  userName: string
  title: string
  content: string
  tags: string[]
  courseName: string
  isPublic: boolean
  aiSummary?: string
  createdAt: Date
  updatedAt: Date
}

const SmartNoteSchema = new Schema<ISmartNote>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  userName: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: { type: [String], default: [] },
  courseName: { type: String, default: 'General Studies' },
  isPublic: { type: Boolean, default: false },
  aiSummary: { type: String },
}, { timestamps: true })

export default mongoose.model<ISmartNote>('SmartNote', SmartNoteSchema)
