import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from './hooks/useStore'
import { loadStoredAuth, logoutUser } from './store/authSlice'
import AppShell from './components/layout/AppShell'
import LoginPage from './pages/auth/LoginPage'
import ToastContainer from './components/ui/ToastContainer'
import GlobalSearch from './components/ui/GlobalSearch'
import CommandPalette from './components/ui/CommandPalette'
import GlobalSpotlight from './components/effects/GlobalSpotlight'

// Lazy-loaded pages
const StudentDashboard = lazy(() => import('./pages/dashboard/StudentDashboard'))
const FacultyDashboard = lazy(() => import('./pages/dashboard/FacultyDashboard'))
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard'))
const MentorDashboard = lazy(() => import('./pages/dashboard/MentorDashboard'))
const RecruiterDashboard = lazy(() => import('./pages/dashboard/RecruiterDashboard'))
const ParentDashboard = lazy(() => import('./pages/dashboard/ParentDashboard'))
const PlacementDashboard = lazy(() => import('./pages/dashboard/PlacementDashboard'))
const HODDashboard = lazy(() => import('./pages/dashboard/HODDashboard'))
const ResearcherDashboard = lazy(() => import('./pages/dashboard/ResearcherDashboard'))
const AlumniDashboard = lazy(() => import('./pages/dashboard/AlumniDashboard'))
const IndustryDashboard = lazy(() => import('./pages/dashboard/IndustryDashboard'))
const SuperAdminDashboard = lazy(() => import('./pages/dashboard/SuperAdminDashboard'))

// Academic
const CoursesPage = lazy(() => import('./pages/academic/CoursesPage'))
const CodeCompilerPage = lazy(() => import('./pages/academic/CodeCompilerPage'))
const AssignmentsPage = lazy(() => import('./pages/academic/AssignmentsPage'))
const AttendancePage = lazy(() => import('./pages/academic/AttendancePage'))
const TimetablePage = lazy(() => import('./pages/academic/TimetablePage'))
const QuizHubPage = lazy(() => import('./pages/academic/QuizHubPage'))
const CourseLearningPage = lazy(() => import('./pages/academic/CourseLearningPage'))
const ExamManagerPage = lazy(() => import('./pages/academic/ExamManagerPage'))
const CollegeCourseDetailPage = lazy(() => import('./pages/academic/CollegeCourseDetailPage'))
const PublicVideoCoursePage = lazy(() => import('./pages/academic/PublicVideoCoursePage'))
const GradebookPage = lazy(() => import('./pages/academic/GradebookPage'))
const StudentAcademicPage = lazy(() => import('./pages/academic/StudentAcademicPage'))


// Career
const JobBoardPage = lazy(() => import('./pages/career/JobBoardPage'))
const ResumeBuilderPage = lazy(() => import('./pages/career/ResumeBuilderPage'))
const MockInterviewPage = lazy(() => import('./pages/career/MockInterviewPage'))
const PlacementHubPage = lazy(() => import('./pages/career/PlacementHubPage'))
const CareerUniversePage = lazy(() => import('./pages/career/CareerUniversePage'))

// Collaboration
const TeamWorkspacePage = lazy(() => import('./pages/collaboration/TeamWorkspacePage'))
const DiscussionForumPage = lazy(() => import('./pages/collaboration/DiscussionForumPage'))
const ProjectKanbanPage = lazy(() => import('./pages/collaboration/ProjectKanbanPage'))

// Campus
const EventsPage = lazy(() => import('./pages/campus/EventsPage'))
const HallOfFamePage = lazy(() => import('./pages/campus/HallOfFamePage'))
const MentorshipPage = lazy(() => import('./pages/campus/MentorshipPage'))
const ClubsAndCommunitiesPage = lazy(() => import('./pages/campus/ClubsAndCommunitiesPage'))

// AI & Analytics
const AICopilotPage = lazy(() => import('./pages/ai/AICopilotPage'))
const AnalyticsPage = lazy(() => import('./pages/analytics/AnalyticsPage'))

// Gamification
const GamificationPage = lazy(() => import('./pages/gamification/GamificationPage'))

// Admin
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage'))
const DepartmentPage = lazy(() => import('./pages/admin/DepartmentPage'))
const AuditLogsPage = lazy(() => import('./pages/admin/AuditLogsPage'))
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'))

// EduShield AI Proctored Assessment Module
const EduShieldExamHome = lazy(() => import('./pages/proctor/EduShieldExamHome'))
const FaceVerificationPage = lazy(() => import('./pages/proctor/FaceVerificationPage'))
const EyeCalibrationPage = lazy(() => import('./pages/proctor/EyeCalibrationPage'))
const LiveExamProctoredPage = lazy(() => import('./pages/proctor/LiveExamProctoredPage'))
const ExamSubmittedPage = lazy(() => import('./pages/proctor/ExamSubmittedPage'))
const StudentIntegrityReportPage = lazy(() => import('./pages/proctor/StudentIntegrityReportPage'))
const ProctorExamCRUDPage = lazy(() => import('./pages/proctor/ProctorExamCRUDPage'))
const FacultyLiveMonitorDashboard = lazy(() => import('./pages/proctor/FacultyLiveMonitorDashboard'))
const FacultyExamAnalyticsPage = lazy(() => import('./pages/proctor/FacultyExamAnalyticsPage'))
const ProctorConfigAdminPage = lazy(() => import('./pages/proctor/ProctorConfigAdminPage'))

// Profile
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'))

import PageSkeletonLoader from './components/ui/PageSkeletonLoader'
import { setTheme, setAccentColor } from './store/uiSlice'
import type { AccentColor } from './types'

function PageLoader() {
  return <PageSkeletonLoader />
}

// Dashboard router based on role
function DashboardRouter() {
  const role = useAppSelector(s => s.auth.user?.role)
  const dashboards: Record<string, React.ReactNode> = {
    student: <StudentDashboard />,
    faculty: <FacultyDashboard />,
    admin: <AdminDashboard />,
    mentor: <MentorDashboard />,
    recruiter: <RecruiterDashboard />,
    parent: <ParentDashboard />,
    placement_officer: <PlacementDashboard />,
    hod: <HODDashboard />,
    researcher: <ResearcherDashboard />,
    alumni: <AlumniDashboard />,
    industry_partner: <IndustryDashboard />,
    super_admin: <SuperAdminDashboard />,
  }
  return dashboards[role || 'student'] || <StudentDashboard />
}

// Protected Route wrapper
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAppSelector(s => s.auth)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  const dispatch = useAppDispatch()
  const theme = useAppSelector(s => s.ui.theme)
  const accentColor = useAppSelector(s => s.ui.accentColor)
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated)
  const user = useAppSelector(s => s.auth.user)
  const [cmdOpen, setCmdOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    dispatch(loadStoredAuth())

    const handleAuthExpired = () => {
      dispatch(logoutUser())
    }
    window.addEventListener('auth:expired', handleAuthExpired)

    // Fetch site metadata & title from Backend API safely
    fetch('/api/v1/admin/public-info')
      .then(res => (res.ok ? res.json() : null))
      .then(res => {
        const info = res?.data
        if (info?.siteName) {
          document.title = info.siteName
          const metaDesc = document.querySelector('meta[name="description"]')
          if (metaDesc && info.metaDescription) metaDesc.setAttribute('content', info.metaDescription)
          const metaKeys = document.querySelector('meta[name="keywords"]')
          if (metaKeys && info.metaKeywords) metaKeys.setAttribute('content', info.metaKeywords)
        }
      })
      .catch(() => {})

    return () => window.removeEventListener('auth:expired', handleAuthExpired)
  }, [dispatch])

  // Load saved theme & accent on user login
  useEffect(() => {
    if (user?.id) {
      const savedTheme = localStorage.getItem(`theme_pref_${user.id}`) as 'light' | 'dark' | 'system' | null
      if (savedTheme && savedTheme !== theme) {
        dispatch(setTheme(savedTheme))
      }
      const savedAccent = localStorage.getItem(`accent_pref_${user.id}`) as AccentColor | null
      if (savedAccent && savedAccent !== accentColor) {
        dispatch(setAccentColor(savedAccent))
      }
    }
  }, [user?.id, dispatch])

  // Apply theme & save to profile
  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    
    // FORCE DARK MODE
    root.classList.remove('light')
    root.classList.add('dark')
    root.setAttribute('data-theme', 'dark')
    body.classList.remove('light', 'light-theme')
    body.classList.add('dark', 'dark-theme')
    
    if (user?.id) {
      localStorage.setItem(`theme_pref_${user.id}`, 'dark')
    }
  }, [theme, user?.id])

  // Apply dynamic accent color to DOM & save
  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    root.setAttribute('data-accent', accentColor)
    body.setAttribute('data-accent', accentColor)
    if (user?.id) {
      localStorage.setItem(`accent_pref_${user.id}`, accentColor)
    }
    localStorage.setItem('edusphere_accent', accentColor)
  }, [accentColor, user?.id])

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

        {/* Protected App Routes */}
        <Route path="/*" element={
          <ProtectedRoute>
            <AppShell>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="dashboard" element={<DashboardRouter />} />

                  {/* Academic Dual Course Ecosystems */}
                  <Route path="courses" element={<CoursesPage />} />
                  <Route path="college-courses" element={<CoursesPage />} />
                  <Route path="college-courses/:courseId" element={<CollegeCourseDetailPage />} />
                  <Route path="learn" element={<CoursesPage />} />
                  <Route path="learn/:courseSlug" element={<PublicVideoCoursePage />} />
                  <Route path="learn/:courseSlug/watch/:lessonId" element={<PublicVideoCoursePage />} />
                  <Route path="courses/:id/learn" element={<CourseLearningPage />} />

                  <Route path="compiler" element={<CodeCompilerPage />} />
                  <Route path="assignments" element={<AssignmentsPage />} />
                  <Route path="attendance" element={<AttendancePage />} />
                  <Route path="timetable" element={<TimetablePage />} />
                  <Route path="quizzes" element={<QuizHubPage />} />
                  <Route path="exams" element={<ExamManagerPage />} />
                  <Route path="academics" element={<StudentAcademicPage />} />
                  <Route path="gradebook" element={<ProtectedRoute allowedRoles={['faculty', 'admin', 'hod', 'super_admin']}><GradebookPage /></ProtectedRoute>} />

                  {/* EduShield AI Proctored Assessment System */}
                  <Route path="proctor/exams" element={<EduShieldExamHome />} />
                  <Route path="proctor/verify/:examId" element={<FaceVerificationPage />} />
                  <Route path="proctor/calibrate/:examId" element={<EyeCalibrationPage />} />
                  <Route path="proctor/live/:examId" element={<LiveExamProctoredPage />} />
                  <Route path="proctor/submitted/:attemptId" element={<ExamSubmittedPage />} />
                  <Route path="proctor/report/:attemptId" element={<StudentIntegrityReportPage />} />
                  <Route path="proctor/manage" element={<ProtectedRoute allowedRoles={['faculty', 'admin', 'hod', 'super_admin']}><ProctorExamCRUDPage /></ProtectedRoute>} />
                  <Route path="proctor/faculty/monitor/:examId" element={<ProtectedRoute allowedRoles={['faculty', 'admin', 'hod', 'super_admin']}><FacultyLiveMonitorDashboard /></ProtectedRoute>} />
                  <Route path="proctor/faculty/analytics" element={<ProtectedRoute allowedRoles={['faculty', 'admin', 'hod', 'super_admin']}><FacultyExamAnalyticsPage /></ProtectedRoute>} />
                  <Route path="proctor/admin/config" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><ProctorConfigAdminPage /></ProtectedRoute>} />

                  {/* Career */}
                  <Route path="jobs" element={<JobBoardPage />} />
                  <Route path="resume" element={<ResumeBuilderPage />} />
                  <Route path="interview" element={<MockInterviewPage />} />
                  <Route path="placement" element={<PlacementHubPage />} />
                  <Route path="career-universe" element={<CareerUniversePage />} />

                  {/* Collaboration */}
                  <Route path="workspace" element={<TeamWorkspacePage />} />
                  <Route path="forum" element={<DiscussionForumPage />} />
                  <Route path="kanban" element={<ProjectKanbanPage />} />

                  {/* Campus */}
                  <Route path="events" element={<EventsPage />} />
                  <Route path="hall-of-fame" element={<HallOfFamePage />} />
                  <Route path="mentorship" element={<MentorshipPage />} />
                  <Route path="clubs" element={<ClubsAndCommunitiesPage />} />

                  {/* AI & Analytics */}
                  <Route path="ai" element={<AICopilotPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />

                  {/* Gamification */}
                  <Route path="gamification" element={<GamificationPage />} />

                  {/* Admin */}
                  <Route path="admin/users" element={<UserManagementPage />} />
                  <Route path="admin/departments" element={<DepartmentPage />} />
                  <Route path="admin/audit-logs" element={<AuditLogsPage />} />
                  <Route path="admin/settings" element={<AdminSettingsPage />} />

                  {/* Profile */}
                  <Route path="profile" element={<ProfilePage />} />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Suspense>
            </AppShell>
          </ProtectedRoute>
        } />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      </Routes>

      <GlobalSearch />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <ToastContainer />
      <GlobalSpotlight />
    </>
  )
}
