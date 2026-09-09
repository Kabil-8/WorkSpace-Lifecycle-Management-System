import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

function CountUp({ target = 0, duration = 1200 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0)
  const ref = useRef(false)
  useEffect(() => {
    if (ref.current) return
    ref.current = true
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setVal(Math.round(ease * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    tick()
  }, [target, duration])
  return <>{val}</>
}

interface StatCardProps {
  icon: React.ElementType
  label: string
  value?: number | string
  suffix?: string
  prefix?: string
  color: string
  trend?: string
  trendUp?: boolean
  context?: string
  delay?: number
  isLoading?: boolean
  onClick?: () => void
  className?: string
}

export default function StatCard({
  icon: Icon,
  label,
  value = 0,
  suffix = '',
  prefix = '',
  color,
  trend,
  trendUp,
  context,
  delay = 0,
  isLoading = false,
  onClick,
  className = '',
}: StatCardProps) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0
  const displayValue = typeof value === 'string' && isNaN(parseFloat(value)) ? value : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      whileHover={onClick ? { y: -3, boxShadow: `0 12px 32px ${color}20` } : { y: -2 }}
      className={`stat-card ${onClick ? 'card-interactive' : ''} ${className}`}
      style={{ borderColor: `${color}20`, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${label}: ${prefix}${displayValue ?? numericValue}${suffix}${trend ? `, ${trendUp ? 'up' : 'down'} ${trend}` : ''}`}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
    >
      {/* Top accent bar */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${color}, ${color}60)`,
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <div
          aria-hidden="true"
          style={{
            width: 42,
            height: 42,
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${color}12`,
            border: `1px solid ${color}22`,
          }}
        >
          <Icon size={20} style={{ color }} />
        </div>

        {trend && (
          <span
            className={trendUp !== false ? 'trend-up' : 'trend-down'}
            aria-label={`${trendUp !== false ? 'Up' : 'Down'} ${trend}`}
          >
            {trendUp !== false
              ? <ArrowUpRight size={10} aria-hidden="true" />
              : <ArrowDownRight size={10} aria-hidden="true" />
            }
            {trend}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="skeleton" style={{ width: '60%', height: 28, marginBottom: 6, borderRadius: 6 }} />
      ) : (
        <p
          style={{ fontSize: '1.625rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--foreground)', lineHeight: 1, marginBottom: 4 }}
          aria-hidden="true"
        >
          {prefix}
          {displayValue ?? <CountUp target={numericValue} />}
          {suffix}
        </p>
      )}

      <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--muted-foreground)' }}>{label}</p>

      {context && (
        <p style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', marginTop: '0.375rem', opacity: 0.8 }}>
          {context}
        </p>
      )}
    </motion.div>
  )
}
