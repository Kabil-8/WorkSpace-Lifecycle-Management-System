import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  message?: string
  compact?: boolean
  className?: string
}

export default function LoadingState({ message = 'Loading...', compact = false, className = '' }: LoadingStateProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        padding: compact ? '1.5rem' : '4rem 2rem',
        color: 'var(--muted-foreground)',
      }}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <Loader2
        size={compact ? 20 : 28}
        style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }}
        aria-hidden="true"
      />
      <p style={{ fontSize: compact ? '0.75rem' : '0.875rem', fontWeight: 500 }}>{message}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
