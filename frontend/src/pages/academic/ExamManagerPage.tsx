import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Clock, MapPin, BookOpen, TrendingUp,
  Award, Target, ChevronRight, AlertTriangle, BarChart2
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts'

const upcomingExams = [
  { subject: 'Data Structures & Algorithms', code: 'CS301', date: 'Aug 14, 2025', time: '10:00 AM', venue: 'Hall A, Room 101', duration: '3 Hours', syllabus: ['Arrays', 'Trees', 'Graphs', 'Dynamic Programming'], daysLeft: 8, color: '#6366F1' },
  { subject: 'Computer Networks', code: 'CS302', date: 'Aug 19, 2025', time: '2:00 PM', venue: 'Hall B, Room 203', duration: '3 Hours', syllabus: ['OSI Model', 'TCP/IP', 'Routing', 'Security'], daysLeft: 13, color: '#3B82F6' },
  { subject: 'Operating Systems', code: 'CS303', date: 'Aug 22, 2025', time: '10:00 AM', venue: 'Hall A, Room 102', duration: '2.5 Hours', syllabus: ['Processes', 'Memory', 'File Systems', 'Deadlocks'], daysLeft: 16, color: '#EC4899' },
]

const pastResults = [
  { subject: 'Database Management', code: 'CS201', date: 'Jun 10', score: 88, total: 100, percentile: 91, rank: 8, grade: 'A', color: '#10B981' },
  { subject: 'Discrete Math', code: 'MA201', date: 'Jun 12', score: 74, total: 100, percentile: 72, rank: 28, grade: 'B+', color: '#F59E0B' },
  { subject: 'Digital Electronics', code: 'EC201', date: 'Jun 15', score: 92, total: 100, percentile: 96, rank: 4, grade: 'A+', color: '#6366F1' },
  { subject: 'Engineering Math', code: 'MA202', date: 'Jun 18', score: 66, total: 100, percentile: 58, rank: 44, grade: 'B', color: '#EC4899' },
  { subject: 'Software Engineering', code: 'CS202', date: 'Jun 22', score: 81, total: 100, percentile: 84, rank: 16, grade: 'A', color: '#3B82F6' },
]

const studyHours = [
  { subject: 'DSA', hours: 18, target: 25 },
  { subject: 'CN', hours: 10, target: 20 },
  { subject: 'OS', hours: 8, target: 20 },
]

const radarData = [
  { subject: 'DSA', score: 72 }, { subject: 'DBMS', score: 88 },
  { subject: 'CN', score: 60 }, { subject: 'OS', score: 65 }, { subject: 'SE', score: 81 },
]

// EDEN auto-revision plan
const revisionPlan = [
  { date: 'Aug 7 (Today)', tasks: ['DSA: Graphs — DFS/BFS (3h)', 'Practise 5 LeetCode Medium'], exam: 'DSA' },
  { date: 'Aug 8', tasks: ['DSA: Dynamic Programming (4h)', 'CN: OSI Model revision (1h)'], exam: 'DSA' },
  { date: 'Aug 9', tasks: ['DSA: Mock test full paper (3h)', 'CN: TCP/IP deep-dive (2h)'], exam: 'DSA' },
  { date: 'Aug 10', tasks: ['DSA: Weak topic review + revision', 'OS: Intro chapters (1h)'], exam: 'DSA' },
]

function CountdownBadge({ days }: { days: number }) {
  const urgency = days <= 5 ? 'red' : days <= 10 ? 'yellow' : 'green'
  const bg = { red: 'rgba(239,68,68,0.15)', yellow: 'rgba(245,158,11,0.15)', green: 'rgba(16,185,129,0.15)' }[urgency]
  const tc = { red: '#F87171', yellow: '#FCD34D', green: '#6EE7B7' }[urgency]
  return (
    <div className="flex flex-col items-center p-2 rounded-xl" style={{ background: bg, border: `1px solid ${tc}30`, minWidth: 52 }}>
      <span className="text-xl font-bold" style={{ color: tc }}>{days}</span>
      <span className="text-2xs" style={{ color: tc }}>days</span>
    </div>
  )
}

export default function ExamManagerPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'results' | 'plan'>('upcoming')
  const [expandedExam, setExpandedExam] = useState<string | null>(null)

  return (
    <div className="page-container space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6"
        style={{ background: 'linear-gradient(135deg, #0f0528 0%, #1e0a50 60%, #2d1580 100%)', border: '1px solid rgba(139,92,246,0.25)' }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Exam Manager</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Upcoming exams, past results, and your EDEN-generated revision plan
            </p>
            <p className="mt-3 text-xs p-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.12)', color: '#DDD6FE', border: '1px solid rgba(139,92,246,0.2)' }}>
              🤖 <strong>EDEN Revision Plan:</strong> Your DSA exam is in 8 days. Based on your weak areas, I've prioritized Graphs and Dynamic Programming — these cover ~40% of expected questions. Follow the plan below to maximize your score.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-center">
              <p className="text-3xl font-bold" style={{ color: '#A78BFA' }}>8</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>days to next exam</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {(['upcoming', 'results', 'plan'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all"
            style={{
              background: activeTab === tab ? 'rgba(139,92,246,0.25)' : 'transparent',
              color: activeTab === tab ? '#A78BFA' : 'var(--text-muted)',
              border: activeTab === tab ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
            }}
          >
            {tab === 'upcoming' ? '📅 Upcoming' : tab === 'results' ? '📊 Results' : '🧠 EDEN Plan'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'upcoming' && (
          <motion.div key="upcoming" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {upcomingExams.map((exam, i) => (
              <motion.div
                key={exam.code}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="stat-card cursor-pointer"
                onClick={() => setExpandedExam(expandedExam === exam.code ? null : exam.code)}
                whileHover={{ borderColor: `${exam.color}40` }}
              >
                <div className="flex items-start gap-4">
                  <CountdownBadge days={exam.daysLeft} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{exam.subject}</p>
                        <p className="text-2xs" style={{ color: exam.color }}>{exam.code}</p>
                      </div>
                      <ChevronRight
                        size={16}
                        style={{ color: 'var(--text-muted)', transform: expandedExam === exam.code ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
                      />
                    </div>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{exam.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{exam.time} · {exam.duration}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{exam.venue}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedExam === exam.code && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Key Syllabus Topics:</p>
                      <div className="flex flex-wrap gap-2">
                        {exam.syllabus.map(topic => (
                          <span key={topic} className="text-2xs px-2.5 py-1 rounded-lg"
                            style={{ background: `${exam.color}12`, color: exam.color, border: `1px solid ${exam.color}20` }}>
                            {topic}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl"
                        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <AlertTriangle size={13} className="text-yellow-400 flex-shrink-0" />
                        <p className="text-xs" style={{ color: '#FCD34D' }}>EDEN: Bring your hall ticket, calculator, and blue pen. Arrive 30 min early.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'results' && (
          <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            {/* Score Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Award, label: 'Average Score', value: '80.2%', color: '#10B981' },
                { icon: TrendingUp, label: 'Best Rank', value: '#4', color: '#F59E0B' },
                { icon: Target, label: 'Avg Percentile', value: '80th', color: '#6366F1' },
                { icon: BarChart2, label: 'Subjects Cleared', value: '5/5', color: '#3B82F6' },
              ].map(({ icon: Icon, label, value, color }, i) => (
                <motion.div key={label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="stat-card">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: `${color}18` }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
                </motion.div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="stat-card">
                <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Score Breakdown</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={pastResults.map(r => ({ name: r.code, score: r.score, pass: 50 }))}>
                    <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: 12 }} />
                    <Bar dataKey="score" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="stat-card">
                <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Performance Radar</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 10 }} />
                    <Radar dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} strokeWidth={2} />
                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Results Table */}
            <div className="stat-card">
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Detailed Results</h3>
              <div className="space-y-2">
                {pastResults.map((r, i) => (
                  <motion.div
                    key={r.code}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-4 p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: r.color }}>
                      {r.grade}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{r.subject}</p>
                      <p className="text-2xs" style={{ color: 'var(--text-muted)' }}>{r.code} · {r.date}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold" style={{ color: r.color }}>{r.score}/{r.total}</p>
                      <p className="text-2xs" style={{ color: 'var(--text-muted)' }}>Score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>{r.percentile}%ile</p>
                      <p className="text-2xs" style={{ color: 'var(--text-muted)' }}>Percentile</p>
                    </div>
                    <div className="text-center hidden sm:block">
                      <p className="text-sm font-bold" style={{ color: '#F59E0B' }}>#{r.rank}</p>
                      <p className="text-2xs" style={{ color: 'var(--text-muted)' }}>Rank</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'plan' && (
          <motion.div key="plan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            {/* Study Hours Tracker */}
            <div className="stat-card">
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Study Hours This Week</h3>
              <div className="space-y-4">
                {studyHours.map((s, i) => (
                  <div key={s.subject}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.subject}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.hours}h / {s.target}h target</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(s.hours / s.target) * 100}%` }}
                        transition={{ duration: 1.2, delay: 0.2 + i * 0.1 }}
                        style={{ background: s.hours / s.target < 0.5 ? '#EF4444' : '#8B5CF6' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* EDEN Day-by-Day Plan */}
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🤖</span>
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>EDEN Auto-Revision Plan</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Generated based on your weak areas and exam timeline</p>
                </div>
              </div>
              <div className="space-y-3">
                {revisionPlan.map((day, i) => (
                  <motion.div
                    key={day.date}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    className="flex gap-4 p-3 rounded-xl"
                    style={{
                      background: i === 0 ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${i === 0 ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)'}`
                    }}
                  >
                    <div className="w-20 flex-shrink-0">
                      <p className="text-xs font-bold" style={{ color: i === 0 ? '#A78BFA' : 'var(--text-secondary)' }}>{day.date}</p>
                      <p className="text-2xs mt-0.5" style={{ color: '#A78BFA' }}>{day.exam}</p>
                    </div>
                    <div className="flex-1 space-y-1">
                      {day.tasks.map(task => (
                        <div key={task} className="flex items-start gap-2">
                          <BookOpen size={12} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{task}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
