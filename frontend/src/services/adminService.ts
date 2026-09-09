import api from './api'

export const adminService = {
  getStats: async () => {
    const res: any = await api.get('/admin/stats')
    return res
  },

  // Audit Logs
  getAuditLogs: async (params?: { severity?: string; page?: number; limit?: number }) => {
    const res: any = await api.get('/admin/audit-logs', { params })
    return res
  },

  clearAuditLogs: async () => {
    const res: any = await api.delete('/admin/audit-logs')
    return res
  },

  // Departments
  getDepartments: async () => {
    const res: any = await api.get('/admin/departments')
    return res
  },

  createDepartment: async (data: any) => {
    const res: any = await api.post('/admin/departments', data)
    return res
  },

  updateDepartment: async (id: string, data: any) => {
    const res: any = await api.put(`/admin/departments/${id}`, data)
    return res
  },

  deleteDepartment: async (id: string) => {
    const res: any = await api.delete(`/admin/departments/${id}`)
    return res
  },

  // User Management
  listUsers: async (params?: { role?: string; department?: string; search?: string; page?: number }) => {
    const res: any = await api.get('/admin/users', { params })
    return res
  },

  createUser: async (data: any) => {
    const res: any = await api.post('/admin/users', data)
    return res
  },

  updateUser: async (id: string, data: any) => {
    const res: any = await api.put(`/admin/users/${id}`, data)
    return res
  },

  deleteUser: async (id: string) => {
    const res: any = await api.delete(`/admin/users/${id}`)
    return res
  },

  // Settings
  getSettings: async () => {
    const res: any = await api.get('/admin/settings')
    return res
  },

  updateSettings: async (data: any) => {
    const res: any = await api.put('/admin/settings', data)
    return res
  },
}
