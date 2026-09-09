import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Flame, Target, Crown, Loader2, CheckCircle2 } from 'lucide-react'
import { gamificationService } from '../../services/gamificationService'

export default function GamificationPage() {
  const { data: profile, isLoading: isProfileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['gamificationMe'],
    queryFn: gamificationService.getMe,
  })

  const { data: leaderboardDataRaw, isLoading: isLeaderboardLoading } = useQuery({
    queryKey: ['gamificationLeaderboard'],
    queryFn: () => gamificationService.getLeaderboard(),
  })

  const p = profile?.data || profile || {}
  const leaderboardRaw = leaderboardDataRaw?.data || leaderboardDataRaw || []
  const leaderboard = Array.isArray(leaderboardRaw) ? leaderboardRaw : (leaderboardRaw?.data || [])

  const missions = p.dailyMissions || []

  const handleMissionComplete = async (mId: string) => {
    try {
      await gamificationService.completeMission(mId)
      refetchProfile()
    } catch (e) {
      console.error(e)
    }
  }

  if (isProfileLoading || isLeaderboardLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-purple-500" size={32} />
      </div>
    )
  }

  const xp = p.xp || 0
  const level = p.level || 1
  const streak = p.streak || 0
  const progress = Math.min(((xp % 500) / 500) * 100, 100)

  return (
    <div className="page-container space-y-6">
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gamification Hub</h1>
        <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">Real XP, Level, Daily Missions & Global Leaderboard from MongoDB</p>
      </motion.div>

      {/* XP Overview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F172A, #1E1B4B)', border: '1px solid rgba(139,92,246,0.2)' }}>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-6xl">🧠</div>
            <div>
              <p className="text-3xl font-bold text-white">Level {level}</p>
              <p className="text-purple-300">EDEN Academic Stage</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-bold text-white">{xp.toLocaleString()} XP</p>
              <p className="text-sm text-slate-400">Real MongoDB Synced</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-2 text-slate-400">
              <span>Level {level}</span>
              <span>{Math.round(progress)}% to Level {level + 1}</span>
            </div>
            <div className="progress-bar h-3">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
                className="progress-fill rounded-full"
                style={{ background: 'linear-gradient(90deg, #8B5CF6, #EC4899)' }} />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <Flame size={18} className="text-orange-500 mb-2" />
          <p className="text-xl font-bold text-white">{streak} days</p>
          <p className="text-xs text-slate-400">Current Streak</p>
        </div>
        <div className="stat-card">
          <Trophy size={18} className="text-yellow-500 mb-2" />
          <p className="text-xl font-bold text-white">{xp.toLocaleString()}</p>
          <p className="text-xs text-slate-400">Total XP</p>
        </div>
        <div className="stat-card">
          <Target size={18} className="text-emerald-500 mb-2" />
          <p className="text-xl font-bold text-white">{p.placementReadinessPct || 75}%</p>
          <p className="text-xs text-slate-400">Placement Score</p>
        </div>
        <div className="stat-card">
          <Crown size={18} className="text-purple-500 mb-2" />
          <p className="text-xl font-bold text-white">Top 5%</p>
          <p className="text-xs text-slate-400">Global Rank</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="stat-card">
          <h3 className="font-semibold text-white mb-3">Daily Missions</h3>
          <div className="space-y-2">
            {missions.map((m: any) => (
              <div
                key={m.id}
                onClick={() => !m.isCompleted && handleMissionComplete(m.id)}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/5 cursor-pointer"
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${m.isCompleted ? 'bg-emerald-500' : 'border border-white/20'}`}>
                  {m.isCompleted && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <span className="text-xs flex-1 truncate" style={{ color: m.isCompleted ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: m.isCompleted ? 'line-through' : 'none' }}>
                  {m.title}
                </span>
                <span className="text-2xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">+{m.xpReward} XP</span>
              </div>
            ))}
          </div>
        </div>

        <div className="stat-card">
          <h3 className="font-semibold text-white mb-3">MongoDB Global Leaderboard</h3>
          <div className="space-y-2">
            {leaderboard.slice(0, 10).map((entry: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02]">
                <span className="text-sm font-bold w-6 text-center">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{entry.user?.name || entry.name || 'Student'}</p>
                  <p className="text-2xs text-slate-400 truncate">{entry.user?.department || 'CSE'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-purple-400">{(entry.xp || 0).toLocaleString()}</p>
                  <p className="text-2xs text-slate-400">XP · Lv.{entry.level || 1}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
