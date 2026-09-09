import mongoose, { Schema, Document } from 'mongoose'

export interface ICurriculumModule {
  id: string
  title: string
  duration: number
  type: 'video' | 'quiz' | 'assignment' | 'reading' | 'game'
  contentUrl?: string
  description?: string
  gameConfig?: {
    gameType: string
    codeSnippet?: string
    targetOutput?: string
  }
  quizQuestions?: Array<{ question: string; options: string[]; answer: number }>
  assignmentDetails?: { maxMarks: number; dueDate: string; allowedTypes: string[] }
  isCompleted?: boolean
}

export interface ICurriculumSection {
  id: string
  title: string
  modules: ICurriculumModule[]
}

export interface ICourse extends Document {
  title: string
  description: string
  instructor: mongoose.Types.ObjectId
  instructorName: string
  department: string
  level: 'beginner' | 'intermediate' | 'advanced'
  status: 'draft' | 'published' | 'archived'
  tags: string[]
  duration: number // hours
  enrolledCount: number
  rating: number
  reviewCount: number
  curriculum: ICurriculumSection[]
  prerequisites: string[]
  objectives: string[]
  language: string
  thumbnail?: string
  schedule?: string
  semester?: number
  credits?: number
  createdAt: Date
  updatedAt: Date
}

const ModuleSchema = new Schema<ICurriculumModule>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  duration: { type: Number, default: 30 },
  type: { type: String, enum: ['video', 'quiz', 'assignment', 'reading', 'game'], default: 'video' },
  contentUrl: { type: String },
  description: { type: String },
  gameConfig: { type: Schema.Types.Mixed },
  quizQuestions: { type: Schema.Types.Mixed },
  assignmentDetails: { type: Schema.Types.Mixed },
  isCompleted: { type: Boolean, default: false },
})

const SectionSchema = new Schema<ICurriculumSection>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  modules: [ModuleSchema],
})

const CourseSchema = new Schema<ICourse>({
  title: { type: String, required: true, index: true },
  description: { type: String, default: '' },
  instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  instructorName: { type: String, required: true },
  department: { type: String, required: true, index: true },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' },
  tags: [{ type: String }],
  duration: { type: Number, default: 40 },
  enrolledCount: { type: Number, default: 0 },
  rating: { type: Number, default: 4.5, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  curriculum: [SectionSchema],
  prerequisites: [{ type: String }],
  objectives: [{ type: String }],
  language: { type: String, default: 'English' },
  thumbnail: { type: String },
  schedule: { type: String },
  semester: { type: Number },
  credits: { type: Number, default: 3 },
}, { timestamps: true })

CourseSchema.index({ title: 'text', description: 'text', tags: 'text' })

export default mongoose.model<ICourse>('Course', CourseSchema)
