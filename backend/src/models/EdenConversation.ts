import mongoose, { Schema, Document } from 'mongoose'

export interface IEdenMessage {
  sender: 'user' | 'eden' | 'system'
  content: string
  intent?: string
  toolCalls?: any[]
  sources?: any[]
  timestamp: Date
}

export interface IEdenConversation extends Document {
  conversationId: string
  userId: mongoose.Types.ObjectId
  role: string
  title?: string
  messages: IEdenMessage[]
  createdAt: Date
  updatedAt: Date
}

const EdenMessageSchema = new Schema<IEdenMessage>({
  sender: { type: String, enum: ['user', 'eden', 'system'], required: true },
  content: { type: String, required: true },
  intent: { type: String },
  toolCalls: { type: Array, default: [] },
  sources: { type: Array, default: [] },
  timestamp: { type: Date, default: Date.now },
})

const EdenConversationSchema = new Schema<IEdenConversation>(
  {
    conversationId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, default: 'student' },
    title: { type: String, default: 'Eden AI Conversation' },
    messages: [EdenMessageSchema],
  },
  { timestamps: true },
)

export default mongoose.models.EdenConversation || mongoose.model<IEdenConversation>('EdenConversation', EdenConversationSchema)
