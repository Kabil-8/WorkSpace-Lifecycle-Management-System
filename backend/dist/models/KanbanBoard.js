import mongoose, { Schema } from 'mongoose';
const KanbanTaskSchema = new Schema({
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
});
const KanbanBoardSchema = new Schema({
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
}, { timestamps: true });
export default mongoose.model('KanbanBoard', KanbanBoardSchema);
