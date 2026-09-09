interface SectionHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export default function SectionHeader({ eyebrow, title, subtitle, action, className = '' }: SectionHeaderProps) {
  return (
    <div className={`section-header ${className}`}>
      <div>
        {eyebrow && (
          <span className="section-label" style={{ marginBottom: '0.5rem', display: 'inline-flex' }}>
            {eyebrow}
          </span>
        )}
        <h2 className="section-title font-display">{title}</h2>
        {subtitle && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
