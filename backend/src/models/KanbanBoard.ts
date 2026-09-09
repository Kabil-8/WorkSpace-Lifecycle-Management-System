import mongoose, { Schema, Document } from 'mongoose'

export interface IKanbanTask {
  id: string
  title: string
  description?: string
  assigneeId?: mongoose.Types.ObjectId
  assigneeName?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'todo' | 'in_progress' | 'review' | 'done'
  dueDate?: Date
  tags: string[]
  order: number
}

export interface IKanbanBoard extends Document {
  title: string
  description?: string
  teamId?: string
  createdById: mongoose.Types.ObjectId
  createdByName: string
  members: { userId: mongoose.Types.ObjectId; name: string; role: string }[]
  tasks: IKanbanTask[]
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

const KanbanTaskSchema = new Schema<IKanbanTask>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  assigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
  assigneeName: { type: String },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['todo', 'in_progress', 'review', 'done'], default: 'todo' },
  dueDate: { type: Date },
  tags: [{ type: String }],
  order: { type: Number, default: 0 },
})

const KanbanBoardSchema = new Schema<IKanbanBoard>({
  title: { type: String, required: true },
  description: { type: String },
  teamId: { type: String },
  createdById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdByName: { type: String, required: true },
  members: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String },
    role: { type: String, default: 'member' },
  }],
  tasks: [KanbanTaskSchema],
  isPublic: { type: Boolean, default: false },
}, { timestamps: true })

export default mongoose.model<IKanbanBoard>('KanbanBoard', KanbanBoardSchema)
