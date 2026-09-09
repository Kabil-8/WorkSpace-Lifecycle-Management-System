import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { User, AuthState, UserRole } from '../types'
import api from '../services/api'

// Role email map for quick role-switcher logins
export const ROLE_EMAIL_MAP: Record<string, string> = {
  student: 'student@edusphere.ai',
  faculty: 'faculty@edusphere.ai',
  mentor: 'mentor@edusphere.ai',
  admin: 'admin@edusphere.ai',
  recruiter: 'recruiter@edusphere.ai',
  parent: 'parent@edusphere.ai',
  placement_officer: 'placement@edusphere.ai',
  hod: 'hod@edusphere.ai',
  researcher: 'researcher@edusphere.ai',
  alumni: 'alumni@edusphere.ai',
  industry_partner: 'industry@edusphere.ai',
  super_admin: 'superadmin@edusphere.ai',
}

// Real API Auth Thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password, role }: { email?: string; password?: string; role?: UserRole }, { rejectWithValue }) => {
    try {
      const loginEmail = email || (role ? ROLE_EMAIL_MAP[role] : 'student@edusphere.ai')
      const loginPassword = password || 'EduSphere@2026'

      const res: any = await api.post('/auth/login', { email: loginEmail, password: loginPassword })

      if (!res.success) {
        return rejectWithValue(res.message || 'Login failed')
      }

      const { token, user: rawUser } = res
      const user: User = {
        id: rawUser.id || rawUser._id,
        name: rawUser.name,
        email: rawUser.email,
        role: rawUser.role,
        avatar: rawUser.avatarUrl,
        department: rawUser.department || 'Computer Science & Engineering',
        bio: rawUser.bio || `${rawUser.name} on EduSphere AI`,
        phone: rawUser.phone,
        rollNumber: rawUser.rollNumber,
        employeeId: rawUser.employeeId,
        skills: rawUser.skills || ['React', 'Node.js', 'Python', 'AI'],
        xp: rawUser.xp || 0,
        level: rawUser.level || 1,
        badges: [],
        streak: rawUser.streak || 0,
        maxStreak: rawUser.maxStreak || 0,
        lastActive: new Date(),
        isVerified: true,
        isActive: true,
        edenStage: rawUser.edenStage || 'assistant',
        preferences: {
          theme: 'dark',
          accentColor: 'blue',
          language: 'en',
          timezone: 'Asia/Kolkata',
          notifications: { email: true, push: true, inApp: true },
          sidebarCollapsed: false,
          edenPersonality: rawUser.edenPersonality || 'mentor',
        },
        createdAt: new Date(rawUser.createdAt || Date.now()),
        updatedAt: new Date(),
      }

      localStorage.setItem('edusphere_token', token)
      localStorage.setItem('edusphere_user', JSON.stringify(user))

      return { user, token }
    } catch (err: any) {
      return rejectWithValue(err.message || 'Invalid email or password')
    }
  }
)

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('edusphere_token')
  localStorage.removeItem('edusphere_user')
})

// Export logout alias for compatibility
export const logout = logoutUser

export const loadStoredAuth = createAsyncThunk('auth/loadStored', async () => {
  const token = localStorage.getItem('edusphere_token')
  const userStr = localStorage.getItem('edusphere_user')
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr) as User
      return { user, token }
    } catch {
      localStorage.removeItem('edusphere_token')
      localStorage.removeItem('edusphere_user')
    }
  }
  return null
})

export const refreshUserProfile = createAsyncThunk('auth/refreshProfile', async () => {
  const res: any = await api.get('/auth/me')
  return res.data
})

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload
    },
    updatePreferences(state, action: PayloadAction<Partial<User['preferences']>>) {
      if (state.user) {
        state.user.preferences = { ...state.user.preferences, ...action.payload }
      }
    },
    clearError(state) {
      state.error = null
    },
    updateXp(state, action: PayloadAction<number>) {
      if (state.user) {
        state.user.xp += action.payload
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload.user
          state.token = action.payload.token
          state.isAuthenticated = true
        }
      })
  },
})

export const { setUser, updatePreferences, clearError, updateXp } = authSlice.actions
export default authSlice.reducer
