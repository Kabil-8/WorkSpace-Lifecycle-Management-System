interface DataQualityBadgeProps {
  quality: 'live' | 'staging' | 'estimated' | 'historical' | 'cached'
  showText?: boolean
  className?: string
}

const QUALITY_MAP = {
  live:      { label: 'Live',       color: 'var(--success)',     icon: '●' },
  staging:   { label: 'Staging',    color: 'var(--warning)',     icon: '◐' },
  estimated: { label: 'AI Estimate',color: 'var(--info)',        icon: '◎' },
  historical:{ label: 'Historical', color: 'var(--muted-foreground)', icon: '○' },
  cached:    { label: 'Cached',     color: 'var(--amber)',       icon: '◑' },
}

export default function DataQualityBadge({ quality, showText = true, className = '' }: DataQualityBadgeProps) {
  const { label, color, icon } = QUALITY_MAP[quality] ?? QUALITY_MAP.cached
  return (
    <span
      className={`model-disclaimer ${className}`}
      aria-label={`Data quality: ${label}`}
      title={`Data quality: ${label}`}
      style={{ color, borderColor: `${color}50` }}
    >
      <span aria-hidden="true" style={{ fontSize: '0.5rem' }}>{icon}</span>
      {showText && label}
    </span>
  )
}
