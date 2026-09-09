import mongoose, { Schema, Document } from 'mongoose'

export interface IEdenDocument extends Document {
  title: string
  category: 'university_rules' | 'syllabus' | 'lab_manual' | 'placement_policy' | 'notes' | 'general' | 'uploaded_document'
  department: string
  content: string
  chunks: { text: string; keywords: string[]; embedding?: number[] }[]
  embedding?: number[]
  uploadedBy: any
  fileName?: string
  fileSize?: number
  createdAt: Date
  updatedAt: Date
}

const EdenDocumentSchema = new Schema<IEdenDocument>({
  title: { type: String, required: true, index: true },
  category: { type: String, required: true, default: 'general' },
  department: { type: String, default: 'All Departments' },
  content: { type: String, required: true },
  embedding: [{ type: Number }],
  chunks: [
    {
      text: { type: String, required: true },
      keywords: [{ type: String }],
      embedding: [{ type: Number }],
    }
  ],
  uploadedBy: { type: mongoose.Schema.Types.Mixed, default: null },
  fileName: { type: String },
  fileSize: { type: Number },
}, { timestamps: true })

export const EdenDocument = mongoose.model<IEdenDocument>('EdenDocument', EdenDocumentSchema)
