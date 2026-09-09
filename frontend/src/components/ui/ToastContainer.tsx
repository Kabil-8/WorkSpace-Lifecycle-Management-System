import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppDispatch, useAppSelector } from '../../hooks/useStore'
import { removeToast } from '../../store/uiSlice'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const COLORS = {
  success: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', icon: '#10B981' },
  error: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', icon: '#EF4444' },
  warning: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', icon: '#F59E0B' },
  info: { bg: 'rgba(37,99,235,0.1)', border: 'rgba(37,99,235,0.2)', icon: '#2563EB' },
}

function ToastItem({ id, type, title, description, duration = 4000 }: {
  id: string; type: 'success' | 'error' | 'warning' | 'info'; title: string; description?: string; duration?: number
}) {
  const dispatch = useAppDispatch()
  const colors = COLORS[type]
  const Icon = ICONS[type]

  useEffect(() => {
    const timer = setTimeout(() => dispatch(removeToast(id)), duration)
    return () => clearTimeout(timer)
  }, [id, duration, dispatch])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="flex items-start gap-3 p-4 rounded-xl max-w-sm w-full shadow-xl"
      style={{ background: colors.bg, border: `1px solid ${colors.border}`, backdropFilter: 'blur(20px)' }}
    >
      <Icon size={18} style={{ color: colors.icon }} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{title}</p>
        {description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{description}</p>}
      </div>
      <button
        onClick={() => dispatch(removeToast(id))}
        className="p-1 rounded-lg transition-colors hover:bg-white/10 flex-shrink-0"
        style={{ color: 'var(--text-muted)' }}
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}

export default function ToastContainer() {
  const toasts = useAppSelector(s => s.ui.toasts)

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem {...toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
