import { motion } from 'framer-motion'

interface RecommendationCardProps {
  priority?: 1 | 2 | 3
  recommendation: string
  why?: string
  effort?: 'low' | 'medium' | 'high'
  cta?: { label: string; onClick: () => void }
  dismissed?: boolean
  onDismiss?: () => void
  className?: string
}

const EFFORT_LABELS = {
  low:    { label: '~15 min',  color: 'var(--success)' },
  medium: { label: '~1 hour', color: 'var(--warning)' },
  high:   { label: '2+ hours', color: 'var(--destructive)' },
}

const PRIORITY_COLORS = ['var(--destructive)', 'var(--warning)', 'var(--info)']

export default function RecommendationCard({
  priority = 1,
  recommendation,
  why,
  effort,
  cta,
  dismissed = false,
  onDismiss,
  className = '',
}: RecommendationCardProps) {
  if (dismissed) return null

  const priorityColor = PRIORITY_COLORS[priority - 1] ?? 'var(--primary)'
  const effortInfo = effort ? EFFORT_LABELS[effort] : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={`recommendation-card ${className}`}
      role="article"
      aria-label={`Recommendation: ${recommendation}`}
      style={{ '--priority-color': priorityColor } as React.CSSProperties}
    >
      {/* Override left bar color */}
      <style>{`.recommendation-card::before { background: ${priorityColor}; }`}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            aria-label={`Priority ${priority}`}
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: `${priorityColor}18`,
              border: `1.5px solid ${priorityColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: priorityColor,
              flexShrink: 0,
            }}
          >
            {priority}
          </span>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.4 }}>
            {recommendation}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss recommendation"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', flexShrink: 0, padding: '0 0.25rem', fontSize: '1rem', lineHeight: 1 }}
          >
            ×
          </button>
        )}
      </div>

      {why && (
        <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', lineHeight: 1.5, paddingLeft: '1.75rem' }}>
          {why}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1.75rem' }}>
        {effortInfo && (
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: effortInfo.color }}>
            Effort: {effortInfo.label}
          </span>
        )}
        {cta && (
          <button
            onClick={cta.onClick}
            className="btn btn-sm btn-primary"
            style={{ fontSize: '0.7rem', padding: '0.2rem 0.625rem' }}
          >
            {cta.label}
          </button>
        )}
      </div>
    </motion.div>
  )
}
