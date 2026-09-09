import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
  compact?: boolean
  className?: string
}

const FRIENDLY_DEFAULT = 'Something went wrong. Please try again.'

export default function ErrorState({
  message = FRIENDLY_DEFAULT,
  onRetry,
  compact = false,
  className = '',
}: ErrorStateProps) {
  // Never expose raw backend errors — use friendly message
  const displayMessage =
    message.toLowerCase().includes('network') ? 'Unable to reach the server. Check your connection and try again.'
    : message.toLowerCase().includes('403') ? 'You don\'t have permission to view this content.'
    : message.toLowerCase().includes('401') ? 'Please sign in to continue.'
    : message.toLowerCase().includes('404') ? 'This content could not be found.'
    : FRIENDLY_DEFAULT

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
        textAlign: 'center',
        color: 'var(--muted-foreground)',
      }}
      role="alert"
      aria-live="assertive"
    >
      <div
        aria-hidden="true"
        style={{
          width: compact ? 36 : 48,
          height: compact ? 36 : 48,
          borderRadius: '50%',
          background: 'var(--destructive-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AlertTriangle size={compact ? 18 : 22} style={{ color: 'var(--destructive)' }} />
      </div>

      <div>
        <p
          style={{
            fontSize: compact ? '0.8125rem' : '0.9375rem',
            fontWeight: 600,
            color: 'var(--foreground)',
            marginBottom: '0.25rem',
          }}
        >
          Something went wrong
        </p>
        <p style={{ fontSize: compact ? '0.75rem' : '0.8125rem', maxWidth: '24rem' }}>
          {displayMessage}
        </p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
        >
          <RefreshCw size={13} aria-hidden="true" />
          Try Again
        </button>
      )}
    </div>
  )
}
