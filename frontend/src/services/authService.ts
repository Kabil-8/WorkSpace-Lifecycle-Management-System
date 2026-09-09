import api from './api'

export const authService = {
  login: async (email: string, password: string) => {
    const res: any = await api.post('/auth/login', { email, password })
    return res?.data || res
  },

  register: async (payload: {
    name: string
    email: string
    password: string
    role: string
    department?: string
  }) => {
    const res: any = await api.post('/auth/register', payload)
    return res?.data || res
  },

  logout: async () => {
    const res: any = await api.post('/auth/logout')
    return res?.data || res
  },

  me: async () => {
    const res: any = await api.get('/auth/me')
    return res?.data || res
  },

  refresh: async (refreshToken: string) => {
    const res: any = await api.post('/auth/refresh', { refreshToken })
    return res?.data || res
  },

  forgotPassword: async (email: string) => {
    const res: any = await api.post('/auth/forgot-password', { email })
    return res?.data || res
  },

  resetPassword: async (token: string, password: string) => {
    const res: any = await api.post('/auth/reset-password', { token, password })
    return res?.data || res
  },

  verifyEmail: async (token: string) => {
    const res: any = await api.post('/auth/verify-email', { token })
    return res?.data || res
  },
}

export default authService
