import { motion } from 'framer-motion'

interface InsightCardProps {
  icon?: React.ReactNode
  title: string
  description: string
  source?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  cta?: { label: string; onClick: () => void }
  isAIGenerated?: boolean
  className?: string
}

const PRIORITY_STYLES = {
  low:      { color: 'var(--muted-foreground)', bg: 'var(--muted)',            border: 'var(--border)' },
  medium:   { color: 'var(--warning)',          bg: 'var(--warning-muted)',     border: 'color-mix(in srgb, var(--warning) 25%, transparent)' },
  high:     { color: 'var(--primary)',          bg: 'var(--primary-muted)',     border: 'color-mix(in srgb, var(--primary) 25%, transparent)' },
  critical: { color: 'var(--destructive)',      bg: 'var(--destructive-muted)', border: 'color-mix(in srgb, var(--destructive) 25%, transparent)' },
}

export default function InsightCard({
  icon,
  title,
  description,
  source,
  priority = 'low',
  cta,
  isAIGenerated = false,
  className = '',
}: InsightCardProps) {
  const style = PRIORITY_STYLES[priority]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`card ${className}`}
      style={{
        padding: '1rem',
        borderColor: style.border,
        position: 'relative',
        overflow: 'hidden',
      }}
      role="article"
      aria-label={`Insight: ${title}`}
    >
      {/* Left accent line */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: style.color,
          borderRadius: '0 2px 2px 0',
        }}
      />

      <div style={{ paddingLeft: '0.75rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.375rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
            {icon && (
              <div style={{ color: style.color, flexShrink: 0, lineHeight: 0 }} aria-hidden="true">
                {icon}
              </div>
            )}
            <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.3 }}>
              {title}
            </h3>
          </div>
          {isAIGenerated && (
            <span className="model-disclaimer" aria-label="AI generated insight">AI</span>
          )}
        </div>

        {/* Description */}
        <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', lineHeight: 1.5, marginBottom: cta ? '0.625rem' : 0 }}>
          {description}
        </p>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
          {source && (
            <span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', fontWeight: 500 }}>
              Source: {source}
            </span>
          )}
          {cta && (
            <button
              onClick={cta.onClick}
              className="btn btn-sm"
              style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
            >
              {cta.label}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
