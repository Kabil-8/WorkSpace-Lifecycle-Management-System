import mongoose, { Schema, Document } from 'mongoose'

export interface IRichChunk {
  chunkId?: string
  documentId?: string
  docTitle?: string
  category?: string
  department?: string
  semester?: number
  sectionTitle?: string
  sourcePage?: number
  chunkIndex?: number
  text: string
  keywords: string[]
  embedding?: number[]
}

export interface IEdenDocument extends Document {
  documentId?: string
  title: string
  category: string
  department: string
  semester?: number
  content: string
  chunks: IRichChunk[]
  embedding?: number[]
  uploadedBy: any
  fileName?: string
  fileSize?: number
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const EdenDocumentSchema = new Schema<IEdenDocument>({
  documentId: { type: String, index: true },
  title: { type: String, required: true, index: true },
  category: { type: String, required: true, default: 'general', index: true },
  department: { type: String, default: 'All Departments', index: true },
  semester: { type: Number, index: true },
  content: { type: String, required: true },
  embedding: [{ type: Number }],
  chunks: [
    {
      chunkId: { type: String },
      documentId: { type: String },
      docTitle: { type: String },
      category: { type: String },
      department: { type: String },
      semester: { type: Number },
      sectionTitle: { type: String },
      sourcePage: { type: Number, default: 1 },
      chunkIndex: { type: Number, default: 0 },
      text: { type: String, required: true },
      keywords: [{ type: String }],
      embedding: [{ type: Number }],
    }
  ],
  uploadedBy: { type: mongoose.Schema.Types.Mixed, default: null },
  fileName: { type: String },
  fileSize: { type: Number },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true })

export const EdenDocument = mongoose.model<IEdenDocument>('EdenDocument', EdenDocumentSchema)
