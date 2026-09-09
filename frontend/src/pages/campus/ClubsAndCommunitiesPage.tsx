import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Users, Calendar,
  Star, MessageCircle, Zap, Code2, Palette, Trophy
} from 'lucide-react'

interface Club {
  id: string
  name: string
  category: string
  members: number
  description: string
  tags: string[]
  icon: string
  color: string
  joined: boolean
  upcomingEvent?: string
  recentActivity: string
  edenMatch?: number
}

const clubs: Club[] = [
  {
    id: '1', name: 'AI Research Club', category: 'Technology', members: 84, icon: '🤖',
    description: 'Explore cutting-edge AI/ML research, read papers, build projects, and collaborate with researchers.',
    tags: ['Python', 'ML', 'Deep Learning', 'NLP'], color: '#6366F1',
    joined: true, upcomingEvent: 'Paper Reading: GPT-4o Analysis — Aug 10',
    recentActivity: 'Weekly paper reading session completed', edenMatch: 97,
  },
  {
    id: '2', name: 'Web Dev Society', category: 'Technology', members: 142, icon: '🌐',
    description: 'Build real-world web projects, learn from industry devs, and showcase your portfolio.',
    tags: ['React', 'Node.js', 'TypeScript', 'Next.js'], color: '#3B82F6',
    joined: true, upcomingEvent: 'Build-a-thon 2025 — Aug 14',
    recentActivity: 'Launched the EduSphere clone project', edenMatch: 94,
  },
  {
    id: '3', name: 'Competitive Programming', category: 'Academics', members: 67, icon: '⚔️',
    description: 'Crack coding interviews and compete on Codeforces, LeetCode, and CodeChef with teammates.',
    tags: ['DSA', 'Algorithms', 'C++', 'Problem Solving'], color: '#F59E0B',
    joined: false, upcomingEvent: 'ICPC Practice Contest — Aug 12',
    recentActivity: 'Team qualified for regional ICPC 2025', edenMatch: 88,
  },
  {
    id: '4', name: 'Open Source Initiative', category: 'Technology', members: 53, icon: '🔓',
    description: 'Contribute to real open source projects on GitHub, build your portfolio, and give back.',
    tags: ['GitHub', 'Git', 'OSS', 'Community'], color: '#10B981',
    joined: false, upcomingEvent: 'Hacktoberfest Kickoff — Aug 20',
    recentActivity: '12 PRs merged to major OSS repos this month', edenMatch: 82,
  },
  {
    id: '5', name: 'Robotics & IoT Club', category: 'Technology', members: 39, icon: '🤖',
    description: 'Build robots, smart devices, and embedded systems using Arduino, Raspberry Pi, and ROS.',
    tags: ['IoT', 'Arduino', 'Raspberry Pi', 'ROS'], color: '#EC4899',
    joined: false, recentActivity: 'Line-follower bot demo at TechFest 2025',
  },
  {
    id: '6', name: 'Creative Arts Society', category: 'Arts', members: 95, icon: '🎨',
    description: 'Photography, design, illustration, and digital art. Express your creative side with fellow artists.',
    tags: ['Design', 'Figma', 'Photography', 'Illustration'], color: '#8B5CF6',
    joined: false, upcomingEvent: 'Photography Exhibition — Aug 25',
    recentActivity: 'Annual design competition concluded',
  },
  {
    id: '7', name: 'Music & Performance', category: 'Arts', members: 78, icon: '🎵',
    description: 'Vocal, instrumental, and performance arts. Participate in college fests and annual day celebrations.',
    tags: ['Music', 'Performance', 'Events', 'Band'], color: '#14B8A6',
    joined: false, recentActivity: 'Performed at Independence Day 2025',
  },
  {
    id: '8', name: 'Sports & Fitness Club', category: 'Sports', members: 210, icon: '🏆',
    description: 'Represent college in inter-college sports, fitness challenges, and annual sports day.',
    tags: ['Cricket', 'Football', 'Gym', 'Athletics'], color: '#F97316',
    joined: true, upcomingEvent: 'Inter-College Cricket Tournament — Aug 22',
    recentActivity: 'Won gold in 4×100m relay at Zonal Sports Meet',
  },
]

const categoryIcons: Record<string, React.ReactNode> = {
  Technology: <Code2 size={12} />,
  Academics: <Star size={12} />,
  Arts: <Palette size={12} />,
  Sports: <Trophy size={12} />,
}

const categories = ['All', 'Technology', 'Academics', 'Arts', 'Sports']

export default function ClubsAndCommunitiesPage() {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set(clubs.filter(c => c.joined).map(c => c.id)))

  const filtered = clubs.filter(c => {
    const matchCat = filter === 'All' || c.category === filter
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    return matchCat && matchSearch
  })

  const toggleJoin = (id: string) => {
    setJoinedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const myClubs = clubs.filter(c => joinedIds.has(c.id))

  return (
    <div className="page-container space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6"
        style={{ background: 'linear-gradient(135deg, #0d0020 0%, #1a0040 60%, #2e005e 100%)', border: '1px solid rgba(139,92,246,0.3)' }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Clubs & Communities</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Discover, join, and engage with campus clubs and student organizations
            </p>
            <p className="mt-3 text-xs p-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.12)', color: '#DDD6FE', border: '1px solid rgba(139,92,246,0.2)' }}>
              🤖 <strong>EDEN Match:</strong> Based on your Python + ML + React skills, you'd be a great fit for the <strong>AI Research Club</strong> (97% match) and <strong>Web Dev Society</strong> (94% match).
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-3xl font-bold" style={{ color: '#A78BFA' }}>{joinedIds.size}</div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>clubs joined</p>
          </div>
        </div>
      </motion.div>

      {/* My Clubs */}
      {myClubs.length > 0 && (
        <div className="stat-card">
          <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>My Clubs</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {myClubs.map(club => (
              <motion.div
                key={club.id}
                whileHover={{ y: -3 }}
                className="p-3 rounded-xl cursor-pointer"
                style={{ background: `${club.color}10`, border: `1px solid ${club.color}20` }}
                onClick={() => setSelectedClub(club)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{club.icon}</span>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{club.name}</p>
                </div>
                <p className="text-2xs" style={{ color: club.color }}>{club.recentActivity}</p>
                {club.upcomingEvent && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <Calendar size={10} style={{ color: 'var(--text-muted)' }} />
                    <p className="text-2xs" style={{ color: 'var(--text-muted)' }}>{club.upcomingEvent}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search clubs or skills..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{
                background: filter === cat ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                color: filter === cat ? '#A78BFA' : 'var(--text-muted)',
                border: `1px solid ${filter === cat ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {cat !== 'All' && <span className="opacity-70">{categoryIcons[cat]}</span>}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Club Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((club, i) => (
          <motion.div
            key={club.id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            whileHover={{ y: -6, scale: 1.01 }}
            className="stat-card cursor-pointer flex flex-col"
            style={{ borderColor: joinedIds.has(club.id) ? `${club.color}30` : undefined }}
            onClick={() => setSelectedClub(club)}
          >
            {/* Club Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: `${club.color}15` }}>
                  {club.icon}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{club.name}</p>
                  <div className="flex items-center gap-1">
                    {categoryIcons[club.category]}
                    <span className="text-2xs" style={{ color: club.color }}>{club.category}</span>
                  </div>
                </div>
              </div>
              {club.edenMatch && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Zap size={10} style={{ color: club.color }} />
                  <span className="text-2xs font-bold" style={{ color: club.color }}>{club.edenMatch}%</span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-xs leading-relaxed flex-1 mb-3" style={{ color: 'var(--text-muted)' }}>
              {club.description.slice(0, 90)}...
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {club.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-2xs px-2 py-0.5 rounded-lg"
                  style={{ background: `${club.color}10`, color: club.color }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-1">
                <Users size={12} style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{club.members} members</span>
              </div>
              <button
                onClick={e => { e.stopPropagation(); toggleJoin(club.id) }}
                className="px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                style={
                  joinedIds.has(club.id)
                    ? { background: `${club.color}20`, color: club.color, border: `1px solid ${club.color}30` }
                    : { background: club.color, color: '#fff' }
                }
              >
                {joinedIds.has(club.id) ? '✓ Joined' : 'Join'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <span className="text-4xl mb-3 block">🔍</span>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No clubs found for "{search}"</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Try a different search or category</p>
        </div>
      )}

      {/* Club Detail Drawer */}
      <AnimatePresence>
        {selectedClub && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setSelectedClub(null)}
            />
            <motion.div
              initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 h-full w-full max-w-sm z-50 overflow-y-auto"
              style={{ background: 'var(--bg-surface)', borderLeft: `1px solid ${selectedClub.color}30` }}
            >
              <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ background: `${selectedClub.color}15` }}>
                      {selectedClub.icon}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{selectedClub.name}</h2>
                      <span className="text-xs" style={{ color: selectedClub.color }}>{selectedClub.category}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedClub(null)} className="text-xl text-slate-400 hover:text-white">×</button>
                </div>

                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{selectedClub.description}</p>

                {selectedClub.edenMatch && (
                  <div className="flex items-center gap-2 p-3 rounded-xl"
                    style={{ background: `${selectedClub.color}10`, border: `1px solid ${selectedClub.color}20` }}>
                    <Zap size={14} style={{ color: selectedClub.color }} />
                    <p className="text-xs" style={{ color: selectedClub.color }}>
                      <strong>{selectedClub.edenMatch}% EDEN Match</strong> — Based on your skill profile, this club is a great fit!
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Skills You'll Learn</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedClub.tags.map(tag => (
                      <span key={tag} className="text-xs px-2.5 py-1 rounded-lg"
                        style={{ background: `${selectedClub.color}12`, color: selectedClub.color, border: `1px solid ${selectedClub.color}20` }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Users size={14} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selectedClub.members} members</span>
                  </div>
                </div>

                {selectedClub.upcomingEvent && (
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={13} style={{ color: selectedClub.color }} />
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Upcoming Event</p>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{selectedClub.upcomingEvent}</p>
                  </div>
                )}

                <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Recent Activity</p>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{selectedClub.recentActivity}</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => toggleJoin(selectedClub.id)}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                    style={
                      joinedIds.has(selectedClub.id)
                        ? { background: `${selectedClub.color}20`, color: selectedClub.color, border: `1px solid ${selectedClub.color}30` }
                        : { background: selectedClub.color, color: '#fff' }
                    }
                  >
                    {joinedIds.has(selectedClub.id) ? '✓ Leave Club' : '+ Join Club'}
                  </button>
                  <button className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <MessageCircle size={15} />
                    Chat
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
