import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, LucideIcon } from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════════
   EDUSPHERE SHARED ENTERPRISE COMPONENT LIBRARY
   All components use CSS variables — zero hardcoded colors
   ═══════════════════════════════════════════════════════════════════════ */

// ── StatCard ──────────────────────────────────────────────────────────
interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  suffix?: string
  prefix?: string
  color?: string
  trend?: string
  trendUp?: boolean
  delay?: number
  onClick?: () => void
}

export function StatCard({ icon: Icon, label, value, suffix = '', prefix = '', color = 'var(--primary)', trend, trendUp = true, delay = 0, onClick }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
      className={`stat-card ${onClick ? 'cursor-pointer' : ''}`}
      style={{ borderColor: `color-mix(in srgb, ${color} 20%, var(--border))` }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `color-mix(in srgb, ${color} 12%, var(--muted))` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
        {trend && (
          <span
            className="flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              color: trendUp ? 'var(--success)' : 'var(--destructive)',
              background: trendUp ? 'var(--success-muted)' : 'var(--destructive-muted)',
            }}
          >
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold mb-0.5" style={{ color: 'var(--card-foreground)' }}>
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </p>
      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
    </motion.div>
  )
}

// ── PageHeader ────────────────────────────────────────────────────────
interface PageHeaderProps {
  icon?: LucideIcon
  title: string
  subtitle?: string
  actions?: React.ReactNode
  badge?: string
}

export function PageHeader({ icon: Icon, title, subtitle, actions, badge }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-muted)] flex items-center justify-center flex-shrink-0">
            <Icon size={20} className="text-[var(--primary)]" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{title}</h1>
            {badge && (
              <span className="badge badge-primary text-2xs">{badge}</span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}

// ── SectionHeader ─────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <div>
        <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>{title}</h2>
        {subtitle && <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ── MetricBadge & StatusChip ──────────────────────────────────────────
export function MetricBadge({ label, variant = 'primary' }: { label: string; variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' }) {
  const styles: Record<string, { bg: string; color: string }> = {
    primary: { bg: 'var(--primary-muted)', color: 'var(--primary)' },
    success: { bg: 'var(--success-muted)', color: 'var(--success)' },
    warning: { bg: 'var(--warning-muted)', color: 'var(--warning)' },
    danger:  { bg: 'var(--destructive-muted)', color: 'var(--destructive)' },
    info:    { bg: 'var(--indigo-muted)', color: 'var(--indigo)' },
  }
  const st = styles[variant] || styles.primary
  return (
    <span
      className="px-2.5 py-0.5 rounded-full text-2xs font-mono font-bold border inline-flex items-center gap-1"
      style={{ background: st.bg, color: st.color, borderColor: `color-mix(in srgb, ${st.color} 30%, transparent)` }}
    >
      {label}
    </span>
  )
}

export function StatusChip({ status }: { status: 'online' | 'offline' | 'active' | 'pending' | 'completed' | string }) {
  const isGood = ['online', 'active', 'completed', 'graded'].includes(status.toLowerCase())
  const isWarn = ['pending', 'in_progress', 'todo'].includes(status.toLowerCase())
  const isBad  = ['offline', 'overdue', 'failed'].includes(status.toLowerCase())

  const color = isGood ? 'var(--success)' : isWarn ? 'var(--amber)' : isBad ? 'var(--destructive)' : 'var(--muted-foreground)'
  const bg    = isGood ? 'var(--success-muted)' : isWarn ? 'var(--warning-muted)' : isBad ? 'var(--destructive-muted)' : 'var(--muted)'

  return (
    <span className="px-2.5 py-1 rounded-full text-2xs font-semibold capitalize inline-flex items-center gap-1.5" style={{ background: bg, color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {status.replace(/_/g, ' ')}
    </span>
  )
}

// ── GlassCard ─────────────────────────────────────────────────────────
export function GlassCard({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`card p-5 ${className}`}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ── ActionButton ──────────────────────────────────────────────────────
export function ActionButton({
  icon: Icon, label, onClick, variant = 'primary', size = 'md', disabled = false
}: {
  icon?: LucideIcon; label: string; onClick?: () => void; variant?: 'primary' | 'secondary' | 'success' | 'danger'; size?: 'sm' | 'md'; disabled?: boolean
}) {
  const cls = variant === 'primary' ? 'btn-primary' : variant === 'success' ? 'btn-success' : variant === 'danger' ? 'btn-danger' : 'btn-secondary'
  const sz  = size === 'sm' ? 'btn-sm text-xs' : 'text-xs'

  return (
    <button onClick={onClick} disabled={disabled} className={`btn ${cls} ${sz} flex items-center gap-1.5 cursor-pointer disabled:opacity-40`}>
      {Icon && <Icon size={size === 'sm' ? 13 : 15} />}
      <span>{label}</span>
    </button>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="empty-state"
    >
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={28} />
        </div>
      )}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {action}
    </motion.div>
  )
}

// ── FilterBar ─────────────────────────────────────────────────────────
interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterBarProps {
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
}

export function FilterBar({ options, value, onChange }: FilterBarProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
          style={{
            background: value === opt.value ? 'var(--primary)' : 'var(--muted)',
            color: value === opt.value ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
            border: `1px solid ${value === opt.value ? 'transparent' : 'var(--border)'}`,
          }}
        >
          {opt.label}
          {opt.count !== undefined && (
            <span
              className="ml-1.5 px-1.5 py-0.5 rounded-full text-2xs font-bold"
              style={{
                background: value === opt.value ? 'rgba(255,255,255,0.2)' : 'var(--elevated)',
                color: value === opt.value ? '#fff' : 'var(--muted-foreground)',
              }}
            >
              {opt.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ── SearchInput ───────────────────────────────────────────────────────
interface SearchInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-10 text-xs"
      />
    </div>
  )
}

// ── LoadingSpinner & SkeletonCard ─────────────────────────────────────
export function LoadingSpinner({ size = 24, label }: { size?: number; label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Loader2 size={size} className="animate-spin" style={{ color: 'var(--primary)' }} />
      {label && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{label}</p>}
    </div>
  )
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card p-5 space-y-3">
      <div className="skeleton h-4 w-2/3 rounded-lg" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton h-3 rounded-lg" style={{ width: `${80 - i * 10}%` }} />
      ))}
    </div>
  )
}

// ── ChartCard Container ───────────────────────────────────────────────
export function ChartCard({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card p-5 space-y-4 border" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{title}</h3>
          {subtitle && <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-2xs font-bold uppercase tracking-widest px-3 mb-1"
      style={{ color: 'var(--muted-foreground)' }}
    >
      {children}
    </p>
  )
}

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export function CountUp({ target = 0, duration = 1200, suffix = '', prefix = '' }: {
  target?: number; duration?: number; suffix?: string; prefix?: string
}) {
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
  return <>{prefix}{val.toLocaleString()}{suffix}</>
}
