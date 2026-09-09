import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { UIState, Toast, ThemeMode, AccentColor } from '../types'

const savedTheme = 'dark' as ThemeMode
const savedAccent = (typeof window !== 'undefined' ? localStorage.getItem('edusphere_accent') : null) as AccentColor || 'blue'

const initialState: UIState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  theme: savedTheme,
  accentColor: savedAccent,
  commandPaletteOpen: false,
  notificationDrawerOpen: false,
  activeModal: null,
  toasts: [],
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) { state.sidebarOpen = !state.sidebarOpen },
    setSidebarOpen(state, action: PayloadAction<boolean>) { state.sidebarOpen = action.payload },
    toggleSidebarCollapsed(state) { state.sidebarCollapsed = !state.sidebarCollapsed },
    setTheme(state, _action: PayloadAction<ThemeMode>) {
      // FORCE DARK MODE ONLY
      state.theme = 'dark'
      const root = document.documentElement
      const body = document.body
      root.classList.remove('light')
      root.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
      body.classList.remove('light', 'light-theme')
      body.classList.add('dark', 'dark-theme')
      try { localStorage.setItem('edusphere_theme', 'dark') } catch {}
    },
    setAccentColor(state, action: PayloadAction<AccentColor>) {
      state.accentColor = action.payload
      const root = document.documentElement
      const body = document.body
      root.setAttribute('data-accent', action.payload)
      body.setAttribute('data-accent', action.payload)
      try { localStorage.setItem('edusphere_accent', action.payload) } catch {}
    },
    setCommandPaletteOpen(state, action: PayloadAction<boolean>) { state.commandPaletteOpen = action.payload },
    setNotificationDrawerOpen(state, action: PayloadAction<boolean>) { state.notificationDrawerOpen = action.payload },
    setActiveModal(state, action: PayloadAction<string | null>) { state.activeModal = action.payload },
    addToast(state, action: PayloadAction<Omit<Toast, 'id'>>) {
      state.toasts.push({ ...action.payload, id: Date.now().toString() })
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter(t => t.id !== action.payload)
    },
    clearToasts(state) { state.toasts = [] },
  },
})

export const {
  toggleSidebar, setSidebarOpen, toggleSidebarCollapsed,
  setTheme, setAccentColor, setCommandPaletteOpen,
  setNotificationDrawerOpen, setActiveModal,
  addToast, removeToast, clearToasts,
} = uiSlice.actions
export default uiSlice.reducer
