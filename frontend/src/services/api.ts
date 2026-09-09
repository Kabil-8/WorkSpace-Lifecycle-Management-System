import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach Bearer token from localStorage or Redux state
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('edusphere_token') || localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Extract response data directly or format error messages
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Clear expired credentials if rejected
      const isLoginRequest = error.config?.url?.includes('/auth/login')
      if (!isLoginRequest) {
        localStorage.removeItem('edusphere_token')
        localStorage.removeItem('token')
        localStorage.removeItem('edusphere_user')
        window.dispatchEvent(new Event('auth:expired'))
      }
    }
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred'
    console.warn('[API Error]:', message)
    return Promise.reject(new Error(message))
  }
)

export default api
