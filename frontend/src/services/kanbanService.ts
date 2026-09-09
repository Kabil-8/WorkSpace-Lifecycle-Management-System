import api from './api'

export const kanbanService = {
  getBoard: async () => {
    const res: any = await api.get('/kanban')
    return res?.data || res
  },
  createTask: async (task: { title: string; description?: string; priority?: string; status?: string; tags?: string[] }) => {
    const res: any = await api.post('/kanban/tasks', task)
    return res?.data || res
  },
  updateTask: async (taskId: string, updates: any) => {
    const res: any = await api.put(`/kanban/tasks/${taskId}`, updates)
    return res?.data || res
  },
  deleteTask: async (taskId: string) => {
    const res: any = await api.delete(`/kanban/tasks/${taskId}`)
    return res?.data || res
  },
}
