import mongoose, { Schema, Document } from 'mongoose'

export interface IReply {
  _id?: mongoose.Types.ObjectId
  authorId: mongoose.Types.ObjectId
  authorName: string
  authorRole: string
  content: string
  likes: mongoose.Types.ObjectId[]
  createdAt: Date
}

export interface IForumPost extends Document {
  title: string
  content: string
  authorId: mongoose.Types.ObjectId
  authorName: string
  authorRole: string
  authorDepartment?: string
  tags: string[]
  category: 'doubt' | 'discussion' | 'announcement' | 'resource' | 'project' | 'placement' | 'general'
  likes: mongoose.Types.ObjectId[]
  replies: IReply[]
  views: number
  isPinned: boolean
  isResolved: boolean
  department?: string
  courseId?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const ReplySchema = new Schema<IReply>({
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  authorRole: { type: String, default: 'student' },
  content: { type: String, required: true },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
})

const ForumPostSchema = new Schema<IForumPost>({
  title: { type: String, required: true, index: true },
  content: { type: String, required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  authorRole: { type: String, default: 'student' },
  authorDepartment: { type: String },
  tags: [{ type: String }],
  category: {
    type: String,
    enum: ['doubt', 'discussion', 'announcement', 'resource', 'project', 'placement', 'general'],
    default: 'general',
  },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  replies: [ReplySchema],
  views: { type: Number, default: 0 },
  isPinned: { type: Boolean, default: false },
  isResolved: { type: Boolean, default: false },
  department: { type: String },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
}, { timestamps: true })

ForumPostSchema.index({ title: 'text', content: 'text', tags: 'text' })

export default mongoose.model<IForumPost>('ForumPost', ForumPostSchema)
