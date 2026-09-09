import { CheckCircle2, AlertCircle, Clock } from 'lucide-react'

interface ProfileField {
  key: string
  label: string
  filled: boolean
  weight?: number // importance weight 1–3
}

interface ProfileCompletenessProps {
  fields: ProfileField[]
  className?: string
  compact?: boolean
}

function getFields(data: Record<string, any>): ProfileField[] {
  return [
    { key: 'avatar',     label: 'Profile Photo',   filled: !!data.avatar,                  weight: 2 },
    { key: 'bio',        label: 'Bio',              filled: !!data.bio && data.bio.length > 10, weight: 2 },
    { key: 'skills',     label: 'Skills',           filled: Array.isArray(data.skills) && data.skills.length >= 3, weight: 3 },
    { key: 'careerGoal', label: 'Career Goal',      filled: !!data.careerGoal,              weight: 3 },
    { key: 'projects',   label: 'Projects',         filled: Array.isArray(data.projects) && data.projects.length > 0, weight: 2 },
    { key: 'certifications', label: 'Certifications', filled: Array.isArray(data.certifications) && data.certifications.length > 0, weight: 1 },
    { key: 'github',     label: 'GitHub',           filled: !!data.externalProfiles?.github?.username, weight: 2 },
    { key: 'linkedin',   label: 'LinkedIn',         filled: !!data.externalProfiles?.linkedin?.url, weight: 2 },
  ]
}

export { getFields }

export default function ProfileCompleteness({ fields, className = '', compact = false }: ProfileCompletenessProps) {
  const totalWeight = fields.reduce((s, f) => s + (f.weight ?? 1), 0)
  const filledWeight = fields.filter(f => f.filled).reduce((s, f) => s + (f.weight ?? 1), 0)
  const percent = Math.round((filledWeight / totalWeight) * 100)

  const missing = fields.filter(f => !f.filled)

  const color =
    percent >= 80 ? 'var(--success)'
    : percent >= 50 ? 'var(--warning)'
    : 'var(--destructive)'

  if (compact) {
    return (
      <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <div style={{ flex: 1, height: 6, borderRadius: 'var(--radius-full)', background: 'var(--muted)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${percent}%`,
              background: color,
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
            }}
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
            aria-label={`Profile ${percent}% complete`}
          />
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color, whiteSpace: 'nowrap' }}>
          {percent}% Complete
        </span>
      </div>
    )
  }

  return (
    <div className={`card ${className}`} style={{ padding: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <div>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}>Profile Strength</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
            {percent < 50 ? 'Build your professional identity' : percent < 80 ? 'Almost there — keep going' : 'Strong profile!'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {percent >= 80
            ? <CheckCircle2 size={18} style={{ color: 'var(--success)' }} aria-hidden="true" />
            : percent >= 50
            ? <Clock size={18} style={{ color: 'var(--warning)' }} aria-hidden="true" />
            : <AlertCircle size={18} style={{ color: 'var(--destructive)' }} aria-hidden="true" />
          }
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color, letterSpacing: '-0.02em' }}>{percent}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{ height: 8, borderRadius: 'var(--radius-full)', background: 'var(--muted)', overflow: 'hidden', marginBottom: '1rem' }}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Profile ${percent}% complete`}
      >
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            background: color,
            borderRadius: 'var(--radius-full)',
            transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </div>

      {/* Missing fields */}
      {missing.length > 0 && (
        <div>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
            Improve Your Profile
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {missing.slice(0, 5).map(f => (
              <span
                key={f.key}
                className="badge badge-muted"
                style={{ fontSize: '0.65rem' }}
                title={`Add your ${f.label}`}
              >
                + {f.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
