interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  compact?: boolean
  className?: string
}

export default function EmptyState({ icon, title, description, action, compact = false, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`empty-state ${className}`}
      style={{ padding: compact ? '2rem 1rem' : '4rem 2rem' }}
      role="status"
      aria-label={title}
    >
      {icon && (
        <div className="empty-state-icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <p className="empty-state-title">{title}</p>
      {description && <p className="empty-state-desc">{description}</p>}
      {action && (
        <button onClick={action.onClick} className="btn btn-primary btn-sm">
          {action.label}
        </button>
      )}
    </div>
  )
}
