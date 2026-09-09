import mongoose, { Schema, Document } from 'mongoose'

export interface IEdenMemory extends Document {
  userId: string
  role: string
  facts: string[]
  factEmbeddings?: { fact: string; vector: number[] }[]
  careerGoal?: string
  preferredLanguages: string[]
  lastActiveRoute?: string
  summaryNotes?: string
  updatedAt: Date
}

const EdenMemorySchema = new Schema<IEdenMemory>({
  userId: { type: String, required: true, unique: true, index: true },
  role: { type: String, required: true, default: 'student' },
  facts: [{ type: String }],
  factEmbeddings: [
    {
      fact: { type: String },
      vector: [{ type: Number }],
    },
  ],
  careerGoal: { type: String },
  preferredLanguages: [{ type: String }],
  lastActiveRoute: { type: String },
  summaryNotes: { type: String },
}, { timestamps: true })

export const EdenMemory = mongoose.model<IEdenMemory>('EdenMemory', EdenMemorySchema)
