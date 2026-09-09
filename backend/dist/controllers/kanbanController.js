import KanbanBoard from '../models/KanbanBoard.js';
export class KanbanController {
    static async getBoard(req, res) {
        try {
            const user = req.user;
            let board = await KanbanBoard.findOne({
                $or: [{ createdById: user._id }, { 'members.userId': user._id }, { isPublic: true }],
            });
            if (!board) {
                board = await KanbanBoard.create({
                    title: 'EduSphere Academic & Project Board',
                    description: 'Course projects, milestones, and task tracking',
                    createdById: user._id,
                    createdByName: user.name,
                    members: [{ userId: user._id, name: user.name, role: 'owner' }],
                    tasks: [
                        { id: 'task-1', title: 'Initialize course projects', priority: 'high', status: 'in_progress', tags: ['academic', 'setup'], order: 0 },
                        { id: 'task-2', title: 'Set up database schemas', priority: 'urgent', status: 'done', tags: ['backend', 'mongodb'], order: 1 },
                    ],
                    isPublic: true,
                });
            }
            return res.json({ success: true, data: board });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    static async createTask(req, res) {
        try {
            const { title, description, priority = 'medium', status = 'todo', tags = [] } = req.body;
            const user = req.user;
            let board = await KanbanBoard.findOne({
                $or: [{ createdById: user._id }, { isPublic: true }],
            });
            if (!board) {
                board = await KanbanBoard.create({
                    title: 'EduSphere Project Board',
                    createdById: user._id,
                    createdByName: user.name,
                    tasks: [],
                    isPublic: true,
                });
            }
            const newTask = {
                id: `task-${Date.now()}`,
                title,
                description,
                assigneeId: user._id,
                assigneeName: user.name,
                priority,
                status,
                tags,
                order: board.tasks.length,
            };
            board.tasks.push(newTask);
            await board.save();
            return res.json({ success: true, data: newTask, board });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    static async updateTask(req, res) {
        try {
            const { taskId } = req.params;
            const { status, title, description, priority } = req.body;
            const board = await KanbanBoard.findOne({ 'tasks.id': taskId });
            if (!board) {
                return res.status(404).json({ success: false, error: 'Task not found' });
            }
            const task = board.tasks.find(t => t.id === taskId);
            if (task) {
                if (status)
                    task.status = status;
                if (title)
                    task.title = title;
                if (description)
                    task.description = description;
                if (priority)
                    task.priority = priority;
            }
            await board.save();
            return res.json({ success: true, data: task, board });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    static async deleteTask(req, res) {
        try {
            const { taskId } = req.params;
            const board = await KanbanBoard.findOne({ 'tasks.id': taskId });
            if (!board) {
                return res.status(404).json({ success: false, error: 'Task not found' });
            }
            board.tasks = board.tasks.filter(t => t.id !== taskId);
            await board.save();
            return res.json({ success: true, message: 'Task deleted successfully' });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
}
