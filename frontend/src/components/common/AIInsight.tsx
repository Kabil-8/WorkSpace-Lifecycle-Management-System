import { Sparkles } from 'lucide-react'

interface AIInsightProps {
  text: string
  confidence?: 'high' | 'medium' | 'low'
  isLoading?: boolean
  className?: string
}

const CONFIDENCE_COLORS = {
  high:   'var(--primary)',
  medium: 'var(--warning)',
  low:    'var(--muted-foreground)',
}

export default function AIInsight({ text, confidence = 'medium', isLoading = false, className = '' }: AIInsightProps) {
  const color = CONFIDENCE_COLORS[confidence]

  return (
    <div
      className={`${className}`}
      style={{
        display: 'flex',
        gap: '0.625rem',
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--primary-muted)',
        border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
      }}
      role="note"
      aria-label="AI insight"
    >
      <Sparkles size={15} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
      <div style={{ flex: 1 }}>
        {isLoading ? (
          <div className="skeleton" style={{ height: 14, width: '80%', borderRadius: 4 }} />
        ) : (
          <p style={{ fontSize: '0.8125rem', color: 'var(--foreground)', lineHeight: 1.5 }}>{text}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.375rem' }}>
          <span className="model-disclaimer">EDEN AI · Staging Model</span>
          {confidence && (
            <span style={{ fontSize: '0.6rem', color, fontWeight: 600 }}>
              {confidence === 'high' ? 'High confidence' : confidence === 'medium' ? 'Moderate confidence' : 'Low confidence'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
