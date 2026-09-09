import { useState, useEffect, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '../../hooks/useStore'
import { logoutUser } from '../../store/authSlice'
import { toggleSidebarCollapsed, setNotificationDrawerOpen, addToast, setTheme } from '../../store/uiSlice'
import { ROLE_CONFIGS } from '../../types'
import { generateInitials, getAvatarGradient } from '../../lib/utils'
import NotificationDrawer from './NotificationDrawer'
import EdenGlobalWidget from '../ai/EdenGlobalWidget'
import { ProctorService } from '../../services/proctorService'
import { assignmentService } from '../../services/assignmentService'
import { notificationService } from '../../services/notificationService'
import { gamificationService } from '../../services/gamificationService'
import {
  LayoutDashboard, BookOpen, ClipboardList, Calendar, Clock,
  Brain, Briefcase, FileEdit, Video, Target, Users, MessageSquare, Kanban,
  Trophy, CalendarDays, Handshake, Sparkles, BarChart3,
  UserCog, Building2, ScrollText, Settings, ChevronLeft, ChevronRight,
  Bell, Search, Sun, Moon, LogOut, User, Menu, X, Zap, Code, Shield,
  ShieldCheck, Award, GraduationCap, BookMarked, Home, BrainCircuit,
} from 'lucide-react'

interface NavItem {
  label: string
  icon: React.ElementType
  path: string
  badge?: string | number
  roles?: string[]
  group?: string
}

const STUDENT_ROLES = ['student']
const FACULTY_ROLES = ['faculty', 'hod']
const ADMIN_ROLES = ['admin', 'super_admin']
const FACULTY_ADMIN_ROLES = [...FACULTY_ROLES, ...ADMIN_ROLES]

const NAV_ITEMS: NavItem[] = [
  // ── OVERVIEW ─────────────────────────────────────────────────────────
  { label: 'Dashboard',         icon: LayoutDashboard,  path: '/dashboard',                     group: 'overview' },

  // ── LEARN ─────────────────────────────────────────────────────────────
  { label: 'My Courses',        icon: BookOpen,         path: '/courses',                        group: 'learn', roles: ['student', 'faculty', 'hod'] },
  { label: 'Smart Notes',       icon: BookMarked,       path: '/learn',                          group: 'learn', roles: STUDENT_ROLES },
  { label: 'Code Compiler',     icon: Code,             path: '/compiler',                       group: 'learn', badge: 'Live', roles: STUDENT_ROLES },
  { label: 'Quiz Hub',          icon: Brain,            path: '/quizzes',                        group: 'learn', roles: ['student', 'faculty', 'mentor', 'hod', 'admin', 'super_admin'] },
  { label: 'Timetable',         icon: Clock,            path: '/timetable',                      group: 'learn', roles: ['student', 'faculty', 'hod'] },
  { label: 'Assignments',       icon: ClipboardList,    path: '/assignments',                    group: 'learn', roles: ['student', 'faculty', 'hod'] },
  { label: 'Attendance',        icon: Calendar,         path: '/attendance',                     group: 'learn', roles: ['student', 'faculty', 'hod', 'admin'] },
  { label: 'My Transcript',     icon: GraduationCap,    path: '/academics',                      group: 'learn', roles: STUDENT_ROLES },
  { label: 'Gradebook',         icon: Award,            path: '/gradebook',                      group: 'learn', roles: FACULTY_ADMIN_ROLES },
  { label: 'Proctored Exams',   icon: Shield,           path: '/proctor/exams',                  group: 'learn', badge: 'AI', roles: STUDENT_ROLES },
  { label: 'Manage Exams',      icon: ShieldCheck,      path: '/proctor/manage',                 group: 'learn', roles: FACULTY_ADMIN_ROLES },
  { label: 'Live Monitor',      icon: Video,            path: '/proctor/faculty/monitor/exam-101', group: 'learn', roles: FACULTY_ADMIN_ROLES },
  { label: 'Proctor Analytics', icon: BarChart3,        path: '/proctor/faculty/analytics',      group: 'learn', roles: FACULTY_ADMIN_ROLES },

  // ── CAREER ────────────────────────────────────────────────────────────
  { label: 'Resume Builder',    icon: FileEdit,         path: '/resume',                         group: 'career', roles: STUDENT_ROLES },
  { label: 'Mock Interview',    icon: Video,            path: '/interview',                      group: 'career', roles: STUDENT_ROLES },
  { label: 'Job Board',         icon: Briefcase,        path: '/jobs',                           group: 'career', roles: ['student', 'alumni', 'placement_officer'] },
  { label: 'Placement Hub',     icon: Target,           path: '/placement',                      group: 'career', roles: ['student', 'faculty', 'hod', 'placement_officer'] },

  // ── COLLABORATE ───────────────────────────────────────────────────────
  { label: 'Team Workspace',    icon: Users,            path: '/workspace',                      group: 'collaborate', roles: ['student', 'faculty', 'hod', 'mentor'] },
  { label: 'Discussion Forum',  icon: MessageSquare,    path: '/forum',                          group: 'collaborate', roles: ['student', 'faculty', 'hod', 'mentor'] },
  { label: 'Project Kanban',    icon: Kanban,           path: '/kanban',                         group: 'collaborate', roles: ['student', 'faculty', 'hod'] },
  { label: 'Events',            icon: CalendarDays,     path: '/events',                         group: 'collaborate', badge: 'New', roles: ['student', 'faculty', 'hod', 'mentor'] },
  { label: 'Hall of Fame',      icon: Trophy,           path: '/hall-of-fame',                   group: 'collaborate', roles: ['student', 'faculty', 'alumni'] },
  { label: 'Mentorship',        icon: Handshake,        path: '/mentorship',                     group: 'collaborate', roles: ['student', 'faculty', 'mentor', 'hod'] },

  // ── INTELLIGENCE ──────────────────────────────────────────────────────
  { label: 'EDEN AI Copilot',   icon: Sparkles,         path: '/ai',                             group: 'intelligence' },
  { label: 'Cognitive Twin',    icon: BrainCircuit,     path: '/gamification',                   group: 'intelligence', roles: STUDENT_ROLES },
  { label: 'Analytics',         icon: BarChart3,        path: '/analytics',                      group: 'intelligence', roles: ['faculty', 'hod', 'admin', 'super_admin'] },

  // ── ADMINISTRATION ────────────────────────────────────────────────────
  { label: 'User Management',   icon: UserCog,          path: '/admin/users',                    group: 'admin', roles: ADMIN_ROLES },
  { label: 'Departments',       icon: Building2,        path: '/admin/departments',              group: 'admin', roles: [...ADMIN_ROLES, 'hod'] },
  { label: 'Audit Logs',        icon: ScrollText,       path: '/admin/audit-logs',               group: 'admin', roles: ADMIN_ROLES },
  { label: 'Settings',          icon: Settings,         path: '/admin/settings',                 group: 'admin', roles: ADMIN_ROLES },
]

const GROUP_CONFIG: Record<string, { label: string; eyebrow?: boolean }> = {
  overview:      { label: '' },
  learn:         { label: 'Learn', eyebrow: true },
  career:        { label: 'Career', eyebrow: true },
  collaborate:   { label: 'Collaborate', eyebrow: true },
  intelligence:  { label: 'Intelligence', eyebrow: true },
  admin:         { label: 'Administration', eyebrow: true },
}

// ── Mobile Bottom Nav ──────────────────────────────────────────────────────
const MOBILE_NAV_ITEMS = [
  { label: 'Home',    icon: Home,       path: '/dashboard' },
  { label: 'Courses', icon: BookOpen,   path: '/courses' },
  { label: 'EDEN AI', icon: Sparkles,   path: '/ai' },
  { label: 'Career',  icon: Briefcase,  path: '/resume' },
  { label: 'Profile', icon: User,       path: '/profile' },
]

function MobileBottomNav({ pathname }: { pathname: string }) {
  const isActive = (p: string) => pathname === p || pathname.startsWith(p + '/')
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {MOBILE_NAV_ITEMS.map(item => {
        const Icon = item.icon
        const active = isActive(item.path)
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`mobile-bottom-nav-item ${active ? 'active' : ''}`}
            aria-current={active ? 'page' : undefined}
            aria-label={item.label}
          >
            <Icon size={20} aria-hidden="true" />
            <span className="mobile-bottom-nav-label">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

// ── Sidebar Nav Component ──────────────────────────────────────────────────
const SidebarNav = memo(function SidebarNav({
  groupedItems,
  sidebarCollapsed,
  pathname,
  setMobileOpen,
  toggleCollapse,
  user,
  roleConfig,
  initials,
  avatarColors,
}: {
  groupedItems: { group: string; label: string; items: NavItem[] }[]
  sidebarCollapsed: boolean
  pathname: string
  setMobileOpen: (open: boolean) => void
  toggleCollapse: () => void
  user: any
  roleConfig: any
  initials: string
  avatarColors: [string, string]
}) {
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')
  const [color1, color2] = avatarColors

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={`flex items-center gap-3 px-4 py-4 border-b h-16 ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
        style={{ borderColor: 'var(--sidebar-border)' }}
      >
        <img src="/tab.png" alt="EduSphere" className="w-8 h-8 object-contain flex-shrink-0" />
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex flex-col justify-center overflow-hidden min-w-0"
            >
              <span className="text-lg font-black tracking-tight whitespace-nowrap leading-none" style={{ color: 'var(--foreground)' }}>
                Edu<span style={{ color: 'var(--primary)' }}>Sphere</span>
              </span>
              <p className="text-[10px] mt-0.5 tracking-widest font-semibold uppercase whitespace-nowrap" style={{ color: 'var(--muted-foreground)', opacity: 0.7 }}>
                AI Education Platform
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 hide-scrollbar" aria-label="Main navigation">
        {groupedItems.map(({ group, label, items }) => (
          <div key={group} className="mb-1">
            {label && !sidebarCollapsed && (
              <p
                className="px-3 pt-3 pb-1 text-2xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--muted-foreground)', opacity: 0.55 }}
                aria-hidden="true"
              >
                {label}
              </p>
            )}
            {label && sidebarCollapsed && (
              <div className="h-px mx-2 my-2" style={{ background: 'var(--border)' }} aria-hidden="true" />
            )}
            {items.map(item => {
              const active = isActive(item.path)
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  aria-label={sidebarCollapsed ? item.label : undefined}
                >
                  <div
                    className={`nav-item ${active ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon size={17} className="flex-shrink-0" aria-hidden="true" />
                    {!sidebarCollapsed && (
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <span className="text-sm whitespace-nowrap">{item.label}</span>
                        {item.badge !== undefined && (
                          <span
                            className="ml-auto text-2xs px-1.5 py-0.5 rounded-full font-semibold"
                            style={{
                              background: typeof item.badge === 'number' ? 'var(--primary-muted)' : 'var(--success-muted)',
                              color: typeof item.badge === 'number' ? 'var(--primary)' : 'var(--success)',
                            }}
                            aria-label={`${item.label} badge: ${item.badge}`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                    {sidebarCollapsed && item.badge !== undefined && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: 'var(--primary)' }} aria-label={`${item.label}: ${item.badge}`} />
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User card at bottom */}
      <div
        className={`border-t px-2 py-3 ${sidebarCollapsed ? '' : 'px-3'}`}
        style={{ borderColor: 'var(--sidebar-border)' }}
      >
        {/* Collapse toggle — desktop only */}
        <button
          onClick={toggleCollapse}
          className={`hidden lg:flex w-full items-center gap-2 px-3 py-2 rounded-xl mb-2 text-sm font-medium transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
          style={{ color: 'var(--muted-foreground)', background: 'var(--accent)' }}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={16} aria-hidden="true" /> : <><ChevronLeft size={16} aria-hidden="true" /><span>Collapse</span></>}
        </button>

        {/* User card */}
        <Link to="/profile" aria-label="View your profile">
          <div
            className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors hover:bg-[var(--accent-hover)] ${sidebarCollapsed ? 'justify-center' : ''}`}
            style={{ background: 'var(--accent)' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${color1}, ${color2})` }}
              aria-hidden="true"
            >
              {initials}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{user?.name}</p>
                <p className="text-2xs truncate font-medium" style={{ color: roleConfig.color }}>
                  {roleConfig.emoji} {roleConfig.label}
                </p>
              </div>
            )}
          </div>
        </Link>
      </div>
    </div>
  )
})

// ── App Shell ──────────────────────────────────────────────────────────────
export default function AppShell({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { user } = useAppSelector(s => s.auth)
  const { sidebarCollapsed, theme, notificationDrawerOpen } = useAppSelector(s => s.ui)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // Live per-user unread notification count query
  const { data: notifNavData } = useQuery({
    queryKey: ['notificationsNav'],
    queryFn: () => notificationService.getMyNotifications({ limit: 10 }),
    staleTime: 20 * 1000,
    enabled: !!user,
  })
  const unreadNotifCount = notifNavData?.unreadCount ?? 0

  // Live per-user gamification & XP synchronization
  const { data: gamificationNavData } = useQuery({
    queryKey: ['myGamificationHeader'],
    queryFn: gamificationService.getMe,
    staleTime: 10 * 1000,
    enabled: !!user,
  })
  const liveXp = gamificationNavData?.data?.xp ?? gamificationNavData?.xp ?? user?.xp ?? 0

  // Real-Time Targeted Per-User Notification Socket Room
  useEffect(() => {
    const activeUserId = (user as any)?._id || user?.id
    if (activeUserId) {
      const socket = ProctorService.getSocket()
      socket.emit('user:join', activeUserId)

      socket.on('notification:push', (notif: any) => {
        if (notif.title && notif.message) {
          dispatch(addToast({
            type: notif.priority === 'urgent' || notif.priority === 'high' ? 'warning' : 'info',
            title: notif.title,
            description: notif.message,
          }))
        }
        queryClient.invalidateQueries({ queryKey: ['notificationsNav'] })
        queryClient.invalidateQueries({ queryKey: ['notificationsDrawer'] })
      })

      return () => {
        socket.off('notification:push')
      }
    }
  }, [user, dispatch, queryClient])

  const role = user?.role || 'student'
  const roleConfig = ROLE_CONFIGS[role]
  const initials = generateInitials(user?.name || 'User')
  const avatarColors = getAvatarGradient(user?.name || 'User')

  // Query student assignments to check if there are actual pending urgent items
  const { data: sidebarAssignments } = useQuery({
    queryKey: ['sidebarAssignmentsQuery'],
    queryFn: () => assignmentService.getAssignments({}),
    staleTime: 60 * 1000,
    enabled: role === 'student',
  })

  const urgentCount = useMemo(() => {
    const raw = Array.isArray(sidebarAssignments) ? sidebarAssignments : (sidebarAssignments?.data || [])
    return raw.filter((a: any) => {
      const due = new Date(a.dueDate || Date.now())
      const daysLeft = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      const isUrgent = a.priority === 'urgent' || a.priority === 'high' || daysLeft <= 2
      const isPending = a.status !== 'submitted' && a.status !== 'graded'
      return isUrgent && isPending
    }).length
  }, [sidebarAssignments])

  const filteredNavItems = NAV_ITEMS.filter(item =>
    !item.roles || item.roles.includes(role)
  ).map(item => {
    if (item.label === 'Assignments') {
      return { ...item, badge: urgentCount > 0 ? urgentCount : undefined }
    }
    return item
  })

  const handleLogout = async () => {
    await dispatch(logoutUser())
    navigate('/login')
    dispatch(addToast({ type: 'info', title: 'Signed out', description: 'See you next time!' }))
  }

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  // Group nav items under new structure
  const groups = ['overview', 'learn', 'career', 'collaborate', 'intelligence', 'admin'] as const
  const groupedItems = groups.map(g => ({
    group: g,
    label: GROUP_CONFIG[g]?.label ?? '',
    items: filteredNavItems.filter(item => item.group === g),
  })).filter(g => g.items.length > 0)

  // Get ATS score for header display
  const atsScore = (user as any)?.atsData?.score ?? (user as any)?.atsScore ?? null

  // Current page label
  const currentPageLabel = NAV_ITEMS.find(n => isActive(n.path))?.label || 'Dashboard'

  const _searchOpen = searchOpen

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar — Desktop */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="hidden lg:flex flex-col relative z-30 flex-shrink-0 overflow-hidden"
        style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
        aria-label="Sidebar navigation"
      >
        <SidebarNav
          groupedItems={groupedItems}
          sidebarCollapsed={sidebarCollapsed}
          pathname={location.pathname}
          setMobileOpen={setMobileOpen}
          toggleCollapse={() => dispatch(toggleSidebarCollapsed())}
          user={user}
          roleConfig={roleConfig}
          initials={initials}
          avatarColors={avatarColors as [string, string]}
        />
      </motion.aside>

      {/* Sidebar — Mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-0 top-0 bottom-0 w-[260px] z-50 flex flex-col lg:hidden"
            style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
            aria-label="Mobile navigation menu"
          >
            <div className="flex items-center justify-end px-4 pt-4">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--muted-foreground)', background: 'var(--accent)' }}
                aria-label="Close navigation menu"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <SidebarNav
              groupedItems={groupedItems}
              sidebarCollapsed={false}
              pathname={location.pathname}
              setMobileOpen={setMobileOpen}
              toggleCollapse={() => dispatch(toggleSidebarCollapsed())}
              user={user}
              roleConfig={roleConfig}
              initials={initials}
              avatarColors={avatarColors as [string, string]}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header / Navbar */}
        <header
          className="flex items-center gap-2.5 px-4 h-16 flex-shrink-0 relative z-40"
          style={{
            background: 'var(--sidebar-bg)',
            borderBottom: '1px solid var(--border)',
          }}
          role="banner"
        >
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-xl transition-colors"
            style={{ color: 'var(--muted-foreground)', background: 'var(--accent)', border: '1px solid var(--border)' }}
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
          >
            <Menu size={18} aria-hidden="true" />
          </button>

          {/* Page title */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: 'var(--foreground)' }}>
              {currentPageLabel}
            </p>
            <p className="text-2xs hidden sm:block font-medium" style={{ color: 'var(--muted-foreground)' }}>
              EduSphere · {roleConfig?.label}
            </p>
          </div>

          {/* Search button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            onClick={() => setSearchOpen(!_searchOpen)}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors"
            style={{
              background: 'var(--muted)',
              border: '1px solid var(--border)',
              color: 'var(--muted-foreground)',
              minWidth: '160px',
            }}
            aria-label="Search (Ctrl+K)"
          >
            <Search size={13} aria-hidden="true" />
            <span style={{ fontSize: '0.8125rem' }}>Search...</span>
            <kbd
              className="ml-auto text-2xs px-1.5 py-0.5 rounded"
              style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
              aria-hidden="true"
            >
              ⌘K
            </kbd>
          </motion.button>

          {/* ATS Score pill — when available */}
          {atsScore !== null && (
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
              style={{
                background: atsScore >= 70 ? 'var(--success-muted)' : atsScore >= 50 ? 'var(--warning-muted)' : 'var(--destructive-muted)',
                border: `1px solid ${atsScore >= 70 ? 'color-mix(in srgb, var(--success) 25%, transparent)' : atsScore >= 50 ? 'color-mix(in srgb, var(--warning) 25%, transparent)' : 'color-mix(in srgb, var(--destructive) 25%, transparent)'}`,
              }}
              aria-label={`ATS Score: ${atsScore}`}
              title={`Career Readiness / ATS Score: ${atsScore}/100`}
            >
              <Target size={11} style={{ color: atsScore >= 70 ? 'var(--success)' : atsScore >= 50 ? 'var(--warning)' : 'var(--destructive)' }} aria-hidden="true" />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: atsScore >= 70 ? 'var(--success)' : atsScore >= 50 ? 'var(--warning)' : 'var(--destructive)' }}>
                ATS {atsScore}
              </span>
            </div>
          )}

          {/* XP Badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
            style={{ background: 'var(--primary-muted)', border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)' }}
            aria-label={`${liveXp.toLocaleString()} XP`}
          >
            <Zap size={11} style={{ color: 'var(--primary)' }} aria-hidden="true" />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)' }}>
              {liveXp.toLocaleString()} XP
            </span>
          </div>

          {/* Theme toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'))}
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--muted-foreground)', background: 'var(--muted)', border: '1px solid var(--border)' }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </motion.button>

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => dispatch(setNotificationDrawerOpen(!notificationDrawerOpen))}
            className="relative p-2 rounded-xl transition-colors"
            style={{ color: 'var(--muted-foreground)', background: 'var(--muted)', border: '1px solid var(--border)' }}
            aria-label={`Notifications${unreadNotifCount > 0 ? ` (${unreadNotifCount} unread)` : ''}`}
          >
            <Bell size={16} aria-hidden="true" />
            {unreadNotifCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                style={{ background: 'var(--primary)', border: '1.5px solid var(--sidebar-bg)' }}
                aria-hidden="true"
              >
                {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
              </span>
            )}
          </motion.button>

          {/* User menu */}
          <div className="relative group">
            <motion.button
              whileHover={{ scale: 1.01 }}
              className="flex items-center gap-2 p-1 pr-2.5 rounded-xl transition-colors"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
              aria-label="User menu"
              aria-haspopup="true"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${avatarColors[0]}, ${avatarColors[1]})` }}
                aria-hidden="true"
              >
                {initials}
              </div>
              <span className="hidden sm:block text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                {user?.name?.split(' ')[0]}
              </span>
            </motion.button>

            {/* Dropdown menu */}
            <div
              className="absolute right-0 top-full mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
              style={{
                background: 'var(--elevated)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                boxShadow: 'var(--shadow-xl)',
              }}
              role="menu"
              aria-label="User menu options"
            >
              <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{user?.name}</p>
                <p className="text-xs mt-0.5 font-medium" style={{ color: roleConfig?.color }}>
                  {roleConfig?.emoji} {roleConfig?.label}
                </p>
                {atsScore !== null && (
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    Career Readiness: <strong style={{ color: atsScore >= 70 ? 'var(--success)' : 'var(--warning)' }}>{atsScore}/100</strong>
                  </p>
                )}
              </div>
              <div className="p-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ color: 'var(--foreground)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  role="menuitem"
                >
                  <User size={14} style={{ color: 'var(--muted-foreground)' }} aria-hidden="true" /> Profile
                </Link>
                <Link
                  to="/admin/settings"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ color: 'var(--foreground)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  role="menuitem"
                >
                  <Settings size={14} style={{ color: 'var(--muted-foreground)' }} aria-hidden="true" /> Settings
                </Link>
                <div className="h-px my-1" style={{ background: 'var(--border)' }} />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ color: 'var(--destructive)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--destructive-muted)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  role="menuitem"
                >
                  <LogOut size={14} aria-hidden="true" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content — padded bottom on mobile for bottom nav */}
        {(() => {
          const isAiPage = location.pathname.startsWith('/ai') || location.pathname.startsWith('/eden')
          return (
            <main
              className={`flex-1 relative reactbits-dot-grid ${isAiPage ? 'overflow-hidden flex flex-col min-h-0' : 'overflow-y-auto'}`}
              style={{ background: 'var(--background)', paddingBottom: isAiPage ? '0' : 'env(safe-area-inset-bottom, 0)' }}
              id="main-content"
              tabIndex={-1}
            >
              {/* ReactBits Ambient Top Aurora Glow */}
              <div className="reactbits-aurora-glow" aria-hidden="true" />

              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                style={{ minHeight: '100%', height: isAiPage ? '100%' : 'auto', paddingBottom: isAiPage ? '0' : '4rem' }}
                className={`relative z-10 lg:pb-0 ${isAiPage ? 'h-full flex flex-col min-h-0' : ''}`}
              >
                {children}
              </motion.div>
            </main>
          )
        })()}
      </div>

      {/* Notification Drawer & Draggable EDEN AI Widget (hidden on full AI page) */}
      <NotificationDrawer />
      {!location.pathname.startsWith('/ai') && !location.pathname.startsWith('/eden') && <EdenGlobalWidget />}

      {/* Mobile Bottom Navigation — hidden on desktop */}
      <MobileBottomNav pathname={location.pathname} />
    </div>
  )
}
