import { useMemo } from 'react'

interface ScoreRingProps {
  score: number          // 0–100
  size?: number          // px diameter
  strokeWidth?: number
  color?: string         // hex / css var
  label?: string
  sublabel?: string
  trend?: 'up' | 'down' | 'stable'
  isLoading?: boolean
  isEstimated?: boolean
  className?: string
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'var(--success)'
  if (score >= 50) return 'var(--warning)'
  return 'var(--destructive)'
}

function getScoreStatus(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 65) return 'Good'
  if (score >= 50) return 'Average'
  if (score >= 35) return 'Below Average'
  return 'Needs Work'
}

export default function ScoreRing({
  score,
  size = 96,
  strokeWidth = 8,
  color,
  label,
  sublabel,
  trend,
  isLoading = false,
  isEstimated = false,
  className = '',
}: ScoreRingProps) {
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const clampedScore = Math.max(0, Math.min(100, score))
  const offset = circumference - (clampedScore / 100) * circumference
  const resolvedColor = color ?? getScoreColor(clampedScore)
  const status = getScoreStatus(clampedScore)

  const trendSymbol = useMemo(() => {
    if (trend === 'up') return '↑'
    if (trend === 'down') return '↓'
    return '→'
  }, [trend])

  if (isLoading) {
    return (
      <div className={`score-ring-container ${className}`} style={{ width: size, height: size }}>
        <svg width={size} height={size} className="score-ring-svg">
          <circle className="score-ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={strokeWidth} />
        </svg>
        <div className="score-ring-label">
          <div className="skeleton" style={{ width: 32, height: 20, borderRadius: 4 }} />
        </div>
      </div>
    )
  }

  return (
    <div
      className={`score-ring-container ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label ?? 'Score'}: ${clampedScore} out of 100 — ${status}`}
    >
      <svg width={size} height={size} className="score-ring-svg" aria-hidden="true">
        <circle
          className="score-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={strokeWidth}
          stroke="var(--muted)"
        />
        <circle
          className="score-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={strokeWidth}
          stroke={resolvedColor}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-ring-label" aria-hidden="true">
        <span
          className="font-display"
          style={{ fontSize: size < 72 ? '0.9rem' : '1.25rem', color: resolvedColor, lineHeight: 1 }}
        >
          {clampedScore}
        </span>
        {label && (
          <span style={{ fontSize: '0.55rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>
            {label}
          </span>
        )}
      </div>

      {/* Trend / sublabel below ring */}
      {(sublabel || trend || isEstimated) && (
        <div
          style={{
            position: 'absolute',
            bottom: -20,
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
          }}
        >
          {isEstimated && (
            <span className="model-disclaimer">AI Model</span>
          )}
          {trend && (
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: trend === 'up' ? 'var(--success)' : trend === 'down' ? 'var(--destructive)' : 'var(--muted-foreground)',
              }}
            >
              {trendSymbol} {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
