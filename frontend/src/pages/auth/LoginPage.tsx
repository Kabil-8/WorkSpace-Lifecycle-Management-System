import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppDispatch, useAppSelector } from '../../hooks/useStore'
import { loginUser } from '../../store/authSlice'
import type { UserRole } from '../../types'
import { ROLE_CONFIGS } from '../../types'
import { Eye, EyeOff, Sparkles, BookOpen, Brain, Trophy, ChevronRight, Zap, ArrowRight } from 'lucide-react'
import Lightfall from '../../components/reactbits/Lightfall'

// ReactBits signature obsidian black + electric violet & lavender palette
const BRAND = {
  black: '#050508',
  dark: '#08080D',
  surface: '#0E0E14',
  purple: '#A855F7',
  violet: '#8B5CF6',
  indigo: '#6366F1',
  cyan: '#38BDF8',
  lavender: '#E9D5FF',
  white: '#FFFFFF',
}

const QUICK_ROLES: { role: UserRole; label: string; emoji: string; desc: string; color: string }[] = [
  { role: 'student', label: 'Student Portal', emoji: '🎓', desc: 'Learning, Code Compiler, Quizzes, Career & Gamification', color: '#A855F7' },
  { role: 'faculty', label: 'Faculty Portal', emoji: '👨‍🏫', desc: 'Courses, Grading, Attendance & Mentee Progress Hub', color: '#818CF8' },
  { role: 'admin', label: 'Admin Portal', emoji: '⚙️', desc: 'User Management, Departments, Audit Logs & Settings', color: '#34D399' },
]

const FEATURES = [
  { icon: Brain, title: 'EDEN AI Companion', desc: 'Your evolving AI assistant' },
  { icon: BookOpen, title: '16 Modules', desc: 'Full academic lifecycle' },
  { icon: Trophy, title: 'Gamification', desc: 'XP, badges & leaderboards' },
  { icon: Zap, title: 'Real-time Collab', desc: 'Live chat & kanban' },
]

const PLATFORM_CAPABILITIES = [
  { val: 'AI', label: 'Adaptive System' },
  { val: '24/7', label: 'EDEN Copilot' },
  { val: 'Live', label: 'Proctoring & RAG' },
]

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const { isLoading, error } = useAppSelector(s => s.auth)
  const [email, setEmail] = useState('student@edusphere.ai')
  const [password, setPassword] = useState('password123')
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [activeTab, setActiveTab] = useState<'signin' | 'quicklogin'>('signin')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await dispatch(loginUser({ email, password }))
  }

  const handleQuickLogin = async (role: UserRole) => {
    setSelectedRole(role)
    await dispatch(loginUser({ email: `${role}@edusphere.ai`, role }))
    setTimeout(() => setSelectedRole(null), 500)
  }

  return (
    <div className="min-h-screen flex" style={{ background: `linear-gradient(145deg, var(--background) 0%, var(--card) 40%, var(--secondary) 100%)` }}>
      {/* ══════════ LEFT PANEL — Brand Showcase ══════════ */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex lg:w-[54%] flex-col relative overflow-hidden"
        style={{ background: `linear-gradient(150deg, ${BRAND.black} 0%, #090910 40%, #160D28 100%)` }}
      >
        {/* Lightfall streaks — ReactBits glowing violet & aurora palette */}
        <div className="absolute inset-0 z-0">
          <Lightfall
            colors={['#C084FC', '#A855F7', '#818CF8', '#38BDF8', '#E9D5FF']}
            backgroundColor={BRAND.black}
            speed={0.4}
            streakCount={1.5}
            streakWidth={0.8}
            streakLength={1.2}
            density={0.5}
            twinkle={1.2}
            glow={1.6}
            backgroundGlow={0.15}
            zoom={2.5}
            opacity={0.85}
            mouseInteraction
            mouseStrength={0.3}
            mouseRadius={0.5}
          />
        </div>

        {/* Radial brand glow overlay */}
        <div className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background:
              `radial-gradient(ellipse 80% 60% at 30% 20%, rgba(168,85,247,0.25) 0%, transparent 60%),
               radial-gradient(ellipse 60% 80% at 80% 80%, rgba(129,140,248,0.18) 0%, transparent 60%),
               radial-gradient(ellipse 100% 100% at 50% 50%, rgba(5,5,8,0.55) 30%, transparent 100%)`,
          }}
        />

        {/* ── Content ── */}
        <div className="relative z-10 flex flex-col h-full p-14">

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="mt-2 mb-3 flex items-center"
          >
            <div className="relative group">
              <div className="absolute -inset-3 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-500 to-indigo-500 opacity-40 blur-xl group-hover:opacity-75 transition duration-500" />
              <img src="/logo.png" alt="EduSphere" className="relative h-20 sm:h-24 md:h-28 object-contain filter drop-shadow-[0_10px_25px_rgba(168,85,247,0.5)]" />
            </div>
          </motion.div>

          {/* Hero content directly below logo with zero gap */}
          <div className="mt-2 flex flex-col justify-start">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.65 }}
            >
              {/* Chip */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-7"
                style={{
                  background: 'rgba(168,85,247,0.12)',
                  border: '1px solid rgba(168,85,247,0.30)',
                  color: '#C084FC',
                  backdropFilter: 'blur(8px)',
                }}>
                <Sparkles size={11} />
                AI-Powered Education Platform
              </div>

              {/* Headline */}
              <h1 className="text-[3.25rem] font-black text-white leading-[1.08] tracking-tight mb-5">
                The Future of{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #E9D5FF 40%, #A855F7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  Education
                </span>
                <br />is Here
              </h1>

              <p className="text-base leading-relaxed max-w-sm" style={{ color: 'rgba(233,213,255,0.75)' }}>
                An enterprise-grade platform that transforms how students learn, grow, and build careers — powered by EDEN AI.
              </p>
            </motion.div>

            {/* Feature cards */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.55 }}
              className="mt-10 grid grid-cols-2 gap-3"
            >
              {FEATURES.map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.08 }}
                  className="flex items-start gap-3 p-3.5 rounded-2xl cursor-default transition-all duration-200 relative overflow-hidden bg-white/5 border border-white/10 backdrop-blur-md"
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(168,85,247,0.20)' }}>
                    <Icon size={15} style={{ color: '#C084FC' }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">{title}</p>
                    <p className="text-2xs mt-0.5" style={{ color: 'rgba(233,213,255,0.6)' }}>{desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="flex items-center gap-10 pt-6 border-t"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          >
            {PLATFORM_CAPABILITIES.map(({ val, label }) => (
              <div key={label}>
                <p className="text-2xl font-black text-white">{val}</p>
                <p className="text-xs" style={{ color: 'rgba(233,213,255,0.55)' }}>{label}</p>
              </div>
            ))}

            {/* Orbital indicator */}
            <div className="ml-auto flex items-center gap-2 text-xs" style={{ color: '#C084FC' }}>
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              Live Platform
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ══════════ RIGHT PANEL — Auth Form ══════════ */}
      {/* On mobile: background is transparent so Lightfall renders underneath */}
      <div className="flex-1 flex items-start sm:items-center justify-center px-4 pt-10 pb-8 sm:p-12 relative lg:border-l shadow-2xl"
        style={{ borderColor: '#27272A', background: '#050508' }}
      >
        {/* Desktop-only solid obsidian background — hidden on mobile */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(145deg, var(--background) 0%, var(--card) 40%, var(--secondary) 100%)` }}
        />

        {/* ── Mobile-only Lightfall animation background ── */}
        <div className="lg:hidden absolute inset-0 z-0 pointer-events-none">
          <Lightfall
            colors={['#C084FC', '#A855F7', '#818CF8', '#38BDF8', '#E9D5FF']}
            backgroundColor={BRAND.black}
            speed={0.4}
            streakCount={1.5}
            streakWidth={0.8}
            streakLength={1.2}
            density={0.5}
            twinkle={1.2}
            glow={1.6}
            backgroundGlow={0.15}
            zoom={2.5}
            opacity={0.85}
            mouseInteraction
            mouseStrength={0.3}
            mouseRadius={0.5}
          />
          {/* Radial overlay so form text stays readable */}
          <div className="absolute inset-0"
            style={{
              background:
                `radial-gradient(ellipse 90% 70% at 50% 50%, rgba(5,5,8,0.65) 0%, transparent 100%),
                 radial-gradient(ellipse 60% 80% at 20% 80%, rgba(168,85,247,0.18) 0%, transparent 60%),
                 radial-gradient(ellipse 60% 60% at 80% 20%, rgba(129,140,248,0.12) 0%, transparent 60%)`,
            }}
          />
        </div>

        {/* Subtle glow behind form — desktop only tweak */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 70%)' }} />

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[420px] relative z-10 px-1"
        >
          {/* Mobile logo — hero-sized, centered, glowing */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <div className="relative w-full flex justify-center">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-600 via-violet-400 to-indigo-500 opacity-35 blur-3xl" />
              <img
                src="/logo.png"
                alt="EduSphere"
                className="relative object-contain filter drop-shadow-[0_10px_30px_rgba(168,85,247,0.7)]"
                style={{ height: '140px', maxWidth: '100%' }}
              />
            </div>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h2 className="font-black mb-1 whitespace-nowrap" style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)', color: '#F4F4F6' }}>
              Welcome back 👋
            </h2>
            <p className="text-sm" style={{ color: '#A1A1AA' }}>Sign in to your EduSphere account</p>
          </div>

          {/* Tabs */}
          <div className="flex rounded-2xl p-1.5 mb-6"
            style={{
              background: '#121218',
              border: '1px solid #27272A',
            }}>
            {(['signin', 'quicklogin'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={activeTab === tab
                  ? {
                    background: '#0B0B0F',
                    color: 'var(--primary)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.7)',
                    border: '1px solid #3F3F46',
                  }
                  : { color: '#A1A1AA' }}
              >
                {tab === 'signin' ? '🔐 Sign In' : '⚡ Quick Login'}
              </button>
            ))}
          </div>

          {/* Form content */}
          <AnimatePresence mode="wait">
            {activeTab === 'signin' ? (
              <motion.form
                key="signin"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@edusphere.ai"
                    className="w-full bg-[#0B0B0F] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm text-[#F4F4F6] focus:outline-none focus:border-purple-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0B0B0F] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm text-[#F4F4F6] focus:outline-none focus:border-purple-500 transition-colors pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-4 py-3 rounded-xl text-sm"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#F87171' }}
                  >
                    {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                  style={{
                    background: 'var(--accent-gradient)',
                    boxShadow: '0 8px 30px var(--primary-muted)',
                  }}
                >
                  {isLoading
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><span>Sign In</span><ArrowRight size={16} /></>}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="quicklogin"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
                  Click any role card to instantly login as that user type
                </p>
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 hide-scrollbar">
                  {QUICK_ROLES.map(({ role, label, emoji, desc, color }) => {
                    const cfg = ROLE_CONFIGS[role]
                    const isSelected = selectedRole === role
                    const isLoggingIn = isLoading && isSelected
                    return (
                      <motion.button
                        key={role}
                        whileHover={{ scale: 1.01, x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuickLogin(role)}
                        disabled={isLoading}
                        className="w-full relative p-3.5 rounded-2xl text-left transition-all duration-200 cursor-pointer flex items-center gap-3.5"
                        style={{
                          background: isSelected ? `${color}18` : '#0B0B0F',
                          border: `1px solid ${isSelected ? color + '60' : '#27272A'}`,
                          boxShadow: isSelected ? `0 0 24px ${color}30` : undefined,
                        }}
                      >
                        {isLoggingIn && (
                          <div className="absolute inset-0 rounded-2xl flex items-center justify-center"
                            style={{ background: 'rgba(5,5,8,0.6)' }}>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          </div>
                        )}
                        <div className="text-xl p-2 rounded-xl flex-shrink-0"
                          style={{ background: `${color}18` }}>
                          {emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold mb-0.5" style={{ color: 'var(--foreground)' }}>{label}</p>
                          <p className="text-2xs line-clamp-1" style={{ color: 'var(--muted-foreground)' }}>{desc}</p>
                        </div>
                        <div className="w-6 h-6 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${cfg.color}15`, color: cfg.color }}>
                          <ChevronRight size={14} />
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <p className="mt-8 text-center text-xs" style={{ color: 'var(--muted-foreground)' }}>
            By signing in, you agree to EduSphere's{' '}
            <span style={{ color: '#C084FC' }} className="cursor-pointer hover:underline">Terms of Service</span>
            {' '}and{' '}
            <span style={{ color: '#C084FC' }} className="cursor-pointer hover:underline">Privacy Policy</span>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

