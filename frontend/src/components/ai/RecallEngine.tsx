import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Brain, Clock, AlertTriangle, CheckCircle2,
  Loader2, RefreshCw, Flame, Target, BookOpen,
  TrendingUp, Calendar, Info
} from 'lucide-react'
import { api } from '../../services/api'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────
interface RecallQueueItem {
  _id: string
  topicId: string
  topicName: string
  subjectName: string
  courseName: string
  mastery: number
  retention: number
  easeFactor: number
  repetitions: number
  interval: number
  lastReviewedAt: string | null
  nextReviewAt: string
  overdueBy: number
  isOverdue: boolean
  priorityScore: number
  priorityReason: string
}

interface RecallAnalytics {
  hasData: boolean
  totalTracked: number
  dueToday: number
  overdue: number
  mastered: number
  avgRetention: number
  avgMastery: number
  reviewStreak: number
  totalSuccessful: number
  totalFailed: number
  message?: string
}

interface ReviewResult {
  topic: string
  quality: number
  mastery: number
  retention: number
  confidence: number
  easeFactor: number
  repetitions: number
  interval: number
  nextReviewAt: string
  correct: boolean
  message: string
}

// ─── API helpers ──────────────────────────────────────────────────────────────
const fetchTodayQueue = async (): Promise<{ queue: RecallQueueItem[]; totalDue: number; overdue: number; hasData: boolean; message?: string }> => {
  const res: any = await api.get('/recall/today')
  return res?.data?.data || res?.data || { queue: [], totalDue: 0, overdue: 0, hasData: false }
}

const fetchAnalytics = async (): Promise<RecallAnalytics> => {
  const res: any = await api.get('/recall/analytics')
  return res?.data?.data || res?.data || { hasData: false, totalTracked: 0, dueToday: 0, overdue: 0, mastered: 0, avgRetention: 0, avgMastery: 0, reviewStreak: 0, totalSuccessful: 0, totalFailed: 0 }
}

const fetchAllItems = async () => {
  const res: any = await api.get('/recall/items')
  return res?.data?.data || { items: [], total: 0, hasData: false }
}

// ─── Retention Ring ───────────────────────────────────────────────────────────
function RetentionRing({ value, size = 52 }: { value: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const fill = circ * (1 - value / 100)
  const color = value >= 70 ? '#10B981' : value >= 40 ? '#F59E0B' : '#EF4444'

  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={6} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={fill}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em"
        fill={color} fontSize={size < 50 ? 9 : 11} fontWeight="700" fontFamily="monospace">
        {value}%
      </text>
    </svg>
  )
}

// ─── Review Card ──────────────────────────────────────────────────────────────
function ReviewCard({
  item,
  onReview,
  reviewingId,
  reviewResult,
}: {
  item: RecallQueueItem
  onReview: (topicId: string, quality: 1 | 3 | 5) => void
  reviewingId: string | null
  reviewResult: (ReviewResult & { topicId: string }) | null
}) {
  const isReviewing = reviewingId === item.topicId
  const thisResult = reviewResult?.topicId === item.topicId ? reviewResult : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-2xl p-4 space-y-3"
      style={{ background: 'var(--elevated)', border: `1px solid ${item.isOverdue ? 'rgba(239,68,68,0.3)' : 'var(--border)'}` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {item.isOverdue && (
              <span className="flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                <AlertTriangle size={10} /> Overdue {item.overdueBy > 0 ? `${Math.floor(item.overdueBy)}d` : ''}
              </span>
            )}
            {!item.isOverdue && (
              <span className="text-2xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)' }}>
                Due Today
              </span>
            )}
          </div>
          <p className="text-xs font-bold mt-1" style={{ color: 'var(--foreground)' }}>{item.topicName}</p>
          <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
            {item.courseName} · {item.subjectName}
          </p>
        </div>
        <RetentionRing value={Math.round(item.retention)} />
      </div>

      {/* SM-2 stats */}
      <div className="grid grid-cols-3 gap-2 text-2xs font-mono">
        <div className="text-center p-1.5 rounded-lg" style={{ background: 'var(--muted)' }}>
          <p className="font-bold" style={{ color: 'var(--indigo)' }}>{item.mastery.toFixed(0)}%</p>
          <p style={{ color: 'var(--muted-foreground)' }}>Mastery</p>
        </div>
        <div className="text-center p-1.5 rounded-lg" style={{ background: 'var(--muted)' }}>
          <p className="font-bold" style={{ color: 'var(--amber)' }}>{item.easeFactor.toFixed(2)}</p>
          <p style={{ color: 'var(--muted-foreground)' }}>Ease</p>
        </div>
        <div className="text-center p-1.5 rounded-lg" style={{ background: 'var(--muted)' }}>
          <p className="font-bold" style={{ color: 'var(--foreground)' }}>{item.repetitions}</p>
          <p style={{ color: 'var(--muted-foreground)' }}>Reps</p>
        </div>
      </div>

      {/* Priority reason */}
      {item.priorityReason && (
        <p className="text-2xs flex items-start gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
          <Info size={10} className="flex-shrink-0 mt-0.5" /> {item.priorityReason}
        </p>
      )}

      {/* Review result */}
      <AnimatePresence mode="wait">
        {thisResult ? (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="p-3 rounded-xl text-center space-y-1"
            style={{ background: thisResult.correct ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.10)', border: `1px solid ${thisResult.correct ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}` }}>
            <p className="text-xs font-bold" style={{ color: thisResult.correct ? '#10B981' : '#EF4444' }}>
              {thisResult.correct ? '✓ Logged' : '✗ Logged'}
            </p>
            <p className="text-2xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
              {thisResult.message}
            </p>
            <p className="text-2xs font-bold" style={{ color: 'var(--foreground)' }}>
              Next review: {new Date(thisResult.nextReviewAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              &nbsp;(in {thisResult.interval} day{thisResult.interval !== 1 ? 's' : ''})
            </p>
          </motion.div>
        ) : (
          <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-2xs mb-2 font-semibold" style={{ color: 'var(--muted-foreground)' }}>
              How well did you remember this topic?
            </p>
            <div className="flex gap-2">
              {([
                { q: 1 as const, label: '🔴 Forgot', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
                { q: 3 as const, label: '🟡 Good',   color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
                { q: 5 as const, label: '🟢 Perfect', color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
              ]).map(({ q, label, color, bg, border }) => (
                <button key={q} disabled={!!isReviewing}
                  onClick={() => onReview(item.topicId, q)}
                  className="flex-1 py-2 rounded-xl text-2xs font-bold transition-all"
                  style={{ background: bg, color, border: `1px solid ${border}`, opacity: isReviewing ? 0.5 : 1 }}>
                  {isReviewing ? <Loader2 size={12} className="animate-spin mx-auto" /> : label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RecallEngine() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'queue' | 'all'>('queue')
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewResults, setReviewResults] = useState<Record<string, ReviewResult & { topicId: string }>>({})

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: todayData, isLoading: queueLoading } = useQuery({
    queryKey: ['recall-today'],
    queryFn: fetchTodayQueue,
    staleTime: 60_000,
  })

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['recall-analytics'],
    queryFn: fetchAnalytics,
    staleTime: 60_000,
  })

  const { data: allData, isLoading: allLoading } = useQuery({
    queryKey: ['recall-items'],
    queryFn: fetchAllItems,
    staleTime: 60_000,
    enabled: activeTab === 'all',
  })

  // ── Mutation: submit review ───────────────────────────────────────────────────
  const reviewMutation = useMutation({
    mutationFn: async ({ topicId, quality }: { topicId: string; quality: 1 | 3 | 5 }) => {
      const res: any = await api.post(`/recall/${topicId}/review`, {
        quality,
        responseTime: 0,
      })
      return { ...(res?.data?.data || {}), topicId } as ReviewResult & { topicId: string }
    },
    onSuccess: (data) => {
      setReviewResults(prev => ({ ...prev, [data.topicId]: data }))
      setReviewingId(null)
      // Invalidate queries to refresh queue + analytics after review
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ['recall-today'] })
        qc.invalidateQueries({ queryKey: ['recall-analytics'] })
        qc.invalidateQueries({ queryKey: ['recall-items'] })
        setReviewResults(prev => {
          const next = { ...prev }
          delete next[data.topicId]
          return next
        })
      }, 3500)
    },
    onError: () => setReviewingId(null),
  })

  const handleReview = (topicId: string, quality: 1 | 3 | 5) => {
    setReviewingId(topicId)
    reviewMutation.mutate({ topicId, quality })
  }

  // ── Retention curve from review history ───────────────────────────────────────
  const retentionCurveData = (() => {
    const items = allData?.items || []
    if (items.length === 0) return []
    // Build time-series from all review history across all items
    const allReviews: { date: string; retention: number }[] = []
    for (const item of items) {
      for (const r of item.reviewHistory || []) {
        const date = new Date(r.reviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        const ret = r.quality === 5 ? 90 : r.quality === 3 ? 60 : 20
        allReviews.push({ date, retention: ret })
      }
    }
    // Group by date, average retention
    const grouped: Record<string, number[]> = {}
    for (const r of allReviews) {
      if (!grouped[r.date]) grouped[r.date] = []
      grouped[r.date].push(r.retention)
    }
    return Object.entries(grouped).slice(-14).map(([date, vals]) => ({
      date,
      retention: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
    }))
  })()

  const queue = todayData?.queue || []
  const totalDue = todayData?.totalDue || 0
  const totalOverdue = todayData?.overdue || 0

  // ── Empty state for new students ─────────────────────────────────────────────
  const isNewStudent = !analyticsLoading && analytics && !analytics.hasData

  return (
    <div className="space-y-4">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={16} style={{ color: 'var(--indigo)' }} />
          <h3 className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
            EDEN Memory · Spaced Repetition
          </h3>
          <span className="text-2xs font-mono px-2 py-0.5 rounded"
            style={{ background: 'var(--indigo-muted)', color: 'var(--indigo)', border: '1px solid color-mix(in srgb, var(--indigo) 30%, transparent)' }}>
            SuperMemo SM-2
          </span>
        </div>
        <button onClick={() => { qc.invalidateQueries({ queryKey: ['recall-today'] }); qc.invalidateQueries({ queryKey: ['recall-analytics'] }) }}
          className="text-2xs px-2 py-1 rounded-lg flex items-center gap-1 transition-opacity hover:opacity-70"
          style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
          <RefreshCw size={10} /> Refresh
        </button>
      </div>

      {/* ── Analytics Strip ────────────────────────────────────────────────────── */}
      {analyticsLoading ? (
        <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin" style={{ color: 'var(--indigo)' }} /></div>
      ) : isNewStudent ? (
        /* Empty state */
        <div className="p-6 rounded-2xl text-center space-y-3"
          style={{ background: 'var(--elevated)', border: '1px dashed var(--border)' }}>
          <Brain size={32} className="mx-auto" style={{ color: 'var(--indigo)', opacity: 0.5 }} />
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
              Your personalized memory schedule hasn't started yet.
            </p>
            <p className="text-2xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
              Complete course lessons, quizzes, or assignments to generate your first recall items.
            </p>
          </div>
          <a href="/courses" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, var(--indigo), #7C3AED)' }}>
            <BookOpen size={13} /> Start Learning
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Today\'s Queue', value: analytics?.dueToday ?? 0, icon: <Calendar size={12} />, color: 'var(--indigo)' },
            { label: 'Overdue', value: analytics?.overdue ?? 0, icon: <AlertTriangle size={12} />, color: analytics?.overdue ? '#EF4444' : 'var(--success)' },
            { label: 'Avg Retention', value: `${analytics?.avgRetention ?? 0}%`, icon: <Target size={12} />, color: 'var(--success)' },
            { label: 'Review Streak', value: `${analytics?.reviewStreak ?? 0}d`, icon: <Flame size={12} />, color: 'var(--amber)' },
          ].map((s, i) => (
            <div key={i} className="p-3 rounded-xl text-center" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-center gap-1 mb-1" style={{ color: s.color }}>{s.icon}</div>
              <p className="text-sm font-extrabold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      {!isNewStudent && (
        <>
          <div className="flex gap-1 p-0.5 rounded-xl" style={{ background: 'var(--muted)' }}>
            {(['queue', 'all'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="flex-1 py-1.5 rounded-lg text-2xs font-semibold transition-all"
                style={activeTab === tab
                  ? { background: 'var(--card)', color: 'var(--foreground)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }
                  : { color: 'var(--muted-foreground)' }}>
                {tab === 'queue' ? `Due Now (${totalDue})` : `All Topics (${allData?.total ?? '...'})`}
              </button>
            ))}
          </div>

          {/* ── Today's Queue ──────────────────────────────────────────────────── */}
          {activeTab === 'queue' && (
            <div className="space-y-3">
              {queueLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={24} className="animate-spin" style={{ color: 'var(--indigo)' }} />
                </div>
              ) : queue.length === 0 ? (
                <div className="p-5 rounded-2xl text-center space-y-2"
                  style={{ background: 'var(--elevated)', border: '1px dashed var(--border)' }}>
                  <CheckCircle2 size={28} className="mx-auto" style={{ color: 'var(--success)' }} />
                  <p className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
                    All caught up! No reviews due right now.
                  </p>
                  <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                    {todayData?.message || 'Keep learning to expand your recall schedule.'}
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {/* Overdue section */}
                  {totalOverdue > 0 && (
                    <div className="space-y-2">
                      <p className="text-2xs font-bold flex items-center gap-1.5" style={{ color: '#EF4444' }}>
                        <AlertTriangle size={11} /> {totalOverdue} Overdue
                      </p>
                      {queue.filter(i => i.isOverdue).map(item => (
                        <ReviewCard key={item.topicId} item={item}
                          onReview={handleReview} reviewingId={reviewingId}
                          reviewResult={reviewResults[item.topicId] || null} />
                      ))}
                    </div>
                  )}
                  {/* Due today */}
                  {queue.filter(i => !i.isOverdue).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-2xs font-bold flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
                        <Clock size={11} /> Due Today
                      </p>
                      {queue.filter(i => !i.isOverdue).map(item => (
                        <ReviewCard key={item.topicId} item={item}
                          onReview={handleReview} reviewingId={reviewingId}
                          reviewResult={reviewResults[item.topicId] || null} />
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              )}
            </div>
          )}

          {/* ── All Items + Retention Curve ────────────────────────────────────── */}
          {activeTab === 'all' && (
            <div className="space-y-4">
              {/* Retention history chart */}
              {retentionCurveData.length > 0 && (
                <div className="p-4 rounded-2xl" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={13} style={{ color: 'var(--indigo)' }} />
                    <p className="text-2xs font-bold" style={{ color: 'var(--foreground)' }}>
                      Memory Retention History (Last 14 Days)
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height={100}>
                    <AreaChart data={retentionCurveData}>
                      <defs>
                        <linearGradient id="retentionGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fontSize: 8, fill: 'var(--muted-foreground)' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: 'var(--muted-foreground)' }} />
                      <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 10 }} />
                      <Area type="monotone" dataKey="retention" stroke="#6366F1" fill="url(#retentionGrad)" strokeWidth={2} dot={{ fill: '#6366F1', r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <p className="text-2xs text-center mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    Built from your actual review history. Each point reflects your recall quality on that day.
                  </p>
                </div>
              )}

              {/* All items list */}
              {allLoading ? (
                <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin" style={{ color: 'var(--indigo)' }} /></div>
              ) : (allData?.items || []).length === 0 ? (
                <div className="p-4 rounded-xl text-center" style={{ background: 'var(--elevated)', border: '1px dashed var(--border)' }}>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No recall items yet. Review a topic to begin.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(allData?.items || []).map((item: any) => (
                    <div key={item._id} className="p-3 rounded-xl flex items-center justify-between gap-3"
                      style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-2xs font-bold truncate" style={{ color: 'var(--foreground)' }}>{item.topicName}</p>
                        <p className="text-2xs truncate" style={{ color: 'var(--muted-foreground)' }}>{item.courseName}</p>
                        <div className="flex items-center gap-3 mt-1 text-2xs font-mono flex-wrap">
                          <span style={{ color: 'var(--indigo)' }}>M: {item.mastery.toFixed(0)}%</span>
                          <span style={{ color: 'var(--success)' }}>R: {item.liveRetention.toFixed(0)}%</span>
                          <span style={{ color: 'var(--muted-foreground)' }}>EF: {item.easeFactor.toFixed(2)}</span>
                          <span style={{ color: 'var(--muted-foreground)' }}>Reps: {item.repetitions}</span>
                        </div>
                      </div>
                      <div className="text-right text-2xs flex-shrink-0">
                        <p className="font-mono" style={{ color: new Date(item.nextReviewAt) <= new Date() ? '#EF4444' : 'var(--success)' }}>
                          {new Date(item.nextReviewAt) <= new Date() ? 'Due' : 'Next'}
                        </p>
                        <p style={{ color: 'var(--muted-foreground)' }}>
                          {new Date(item.nextReviewAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Stats summary */}
              {analytics?.hasData && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {[
                    { label: 'Successful Recalls', value: analytics.totalSuccessful, color: 'var(--success)' },
                    { label: 'Failed Recalls', value: analytics.totalFailed, color: '#EF4444' },
                    { label: 'Mastered (≥80%)', value: analytics.mastered, color: 'var(--amber)' },
                    { label: 'Avg Mastery', value: `${analytics.avgMastery}%`, color: 'var(--indigo)' },
                  ].map((s, i) => (
                    <div key={i} className="p-2.5 rounded-xl text-center" style={{ background: 'var(--muted)' }}>
                      <p className="text-sm font-extrabold" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
