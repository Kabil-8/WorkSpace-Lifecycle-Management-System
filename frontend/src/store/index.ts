import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import authReducer from './authSlice'
import uiReducer from './uiSlice'
import edenReducer from './edenSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    eden: edenReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/login/fulfilled'],
        ignoredPaths: ['auth.user.createdAt', 'auth.user.updatedAt', 'auth.user.lastActive'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
