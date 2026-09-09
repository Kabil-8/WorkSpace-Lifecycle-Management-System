import mongoose, { Schema, Document } from 'mongoose'

export interface ICodeSubmission extends Document {
  userId: string
  language: string
  code: string
  input?: string
  stdout: string
  stderr: string
  status: 'success' | 'error' | 'timeout'
  executionTimeMs: number
  exitCode: number | null
  createdAt: Date
}

const CodeSubmissionSchema: Schema = new Schema({
  userId: { type: String, required: true },
  language: { type: String, required: true },
  code: { type: String, required: true },
  input: { type: String },
  stdout: { type: String, default: '' },
  stderr: { type: String, default: '' },
  status: { type: String, enum: ['success', 'error', 'timeout'], required: true },
  executionTimeMs: { type: Number, default: 0 },
  exitCode: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model<ICodeSubmission>('CodeSubmission', CodeSubmissionSchema)
