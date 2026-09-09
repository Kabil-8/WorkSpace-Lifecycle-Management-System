// EduSphere — Complete TypeScript Type System
// All domain types, interfaces, and enums for the EduSphere platform

// ─── User & Auth ──────────────────────────────────────────────────────────

export type UserRole =
  | 'student'
  | 'faculty'
  | 'mentor'
  | 'admin'
  | 'recruiter'
  | 'parent'
  | 'placement_officer'
  | 'hod'
  | 'researcher'
  | 'alumni'
  | 'industry_partner'
  | 'super_admin';

export type EdenStage =
  | 'seed'       // Day 1 - 🥚
  | 'spark'      // Week 1 - ⚡
  | 'assistant'  // Month 1 - 🤖
  | 'mentor'     // Semester 1 - 🧠
  | 'hologram'   // Year 2 - 🌟
  | 'guardian'   // Graduation - 👑
  | 'career';    // Post-grad - 🚀

export type EdenPersonality = 'teacher' | 'friend' | 'mentor' | 'coach' | 'career';

export type ThemeMode = 'dark' | 'light' | 'system';

export type AccentColor = 'blue' | 'purple' | 'cyan' | 'green' | 'orange' | 'pink';

export interface UserPreferences {
  theme: ThemeMode;
  accentColor: AccentColor;
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  sidebarCollapsed: boolean;
  edenPersonality: EdenPersonality;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  semester?: number;
  section?: string;
  isClassTeacher?: boolean;
  classTeacherSection?: string;
  classTeacherDepartment?: string;
  classTeacherSemester?: number;
  bio?: string;
  phone?: string;
  rollNumber?: string;      // Students only
  employeeId?: string;      // Faculty/Staff only
  cgpa?: number;
  batch?: string;
  weakSubjects?: string[];
  strongSubjects?: string[];
  placementReadiness?: number;
  careerGoal?: string;
  skills: string[];
  xp: number;
  level: number;
  badges: Badge[];
  streak: number;
  maxStreak: number;
  lastActive: Date;
  isVerified: boolean;
  isActive: boolean;
  edenStage: EdenStage;
  preferences: UserPreferences;
  externalProfiles?: {
    leetcode?: {
      username?: string;
      profileUrl?: string;
      ranking?: number;
      campusRank?: number;
      totalSolved?: number;
      easySolved?: number;
      mediumSolved?: number;
      hardSolved?: number;
      contestRating?: number;
      acceptanceRate?: number;
      streak?: number;
      topBadge?: string;
      lastSyncedAt?: Date | string;
    };
    github?: {
      username?: string;
      profileUrl?: string;
      publicRepos?: number;
      totalStars?: number;
      totalCommits?: number;
      topLanguages?: string[];
      followers?: number;
      contributionsThisYear?: number;
      campusRank?: number;
      developerScore?: number;
      lastSyncedAt?: Date | string;
    };
    linkedin?: {
      profileUrl?: string;
      username?: string;
      headline?: string;
      connections?: number;
      verifiedSkills?: string[];
      certifications?: string[];
      lastSyncedAt?: Date | string;
    };
    overallDeveloperRank?: {
      score: number;
      campusRank: number;
      totalStudents: number;
      campusPercentile: number;
      globalTier: string;
      badge: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ─── EDEN AI Companion ────────────────────────────────────────────────────

export interface EdenConfig {
  stage: EdenStage;
  stageLabel: string;
  stageEmoji: string;
  primaryColor: string;
  glowColor: string;
  personality: EdenPersonality;
  evolutionXpThreshold: number;
  evolutionDescription: string;
}

export interface EdenMessage {
  id: string;
  role: 'user' | 'eden';
  content: string;
  timestamp: Date;
  mode?: string;
  type?: 'text' | 'code' | 'quiz' | 'plan' | 'insight';
}

export interface EdenInsight {
  id: string;
  type: 'warning' | 'tip' | 'achievement' | 'recommendation' | 'reminder';
  title: string;
  description: string;
  actionLabel?: string;
  actionRoute?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface EdenState {
  stage: EdenStage;
  personality: EdenPersonality;
  isOpen: boolean;
  isMinimized: boolean;
  messages: EdenMessage[];
  insights: EdenInsight[];
  greeting: string;
  isTyping: boolean;
  evolutionProgress: number;
  unreadCount: number;
  xpToNextStage: number;
  currentXp: number;
}

// ─── Courses ──────────────────────────────────────────────────────────────

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'draft' | 'published' | 'archived';

export interface CourseModule {
  id: string;
  title: string;
  duration: number;    // minutes
  type: 'video' | 'reading' | 'quiz' | 'assignment' | 'lab';
  isCompleted?: boolean;
  url?: string;
}

export interface CourseCurriculum {
  id: string;
  title: string;
  modules: CourseModule[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  instructor: {
    id: string;
    name: string;
    avatar?: string;
  };
  department: string;
  level: CourseLevel;
  status: CourseStatus;
  tags: string[];
  duration: number;    // hours
  enrolledCount: number;
  rating: number;
  reviewCount: number;
  curriculum: CourseCurriculum[];
  prerequisites: string[];
  objectives: string[];
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  course: Course;
  progress: number;     // 0-100
  completedModules: string[];
  startedAt: Date;
  completedAt?: Date;
  grade?: string;
  certificate?: string;
}

// ─── Assignments ──────────────────────────────────────────────────────────

export type AssignmentStatus = 'todo' | 'in_progress' | 'submitted' | 'graded' | 'late';
export type AssignmentPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  instructorId: string;
  dueDate: Date;
  maxMarks: number;
  allowedFileTypes: string[];
  priority: AssignmentPriority;
  status?: AssignmentStatus;
  submittedAt?: Date;
  marks?: number;
  feedback?: string;
  plagiarismScore?: number;
  attachments?: FileAttachment[];
  createdAt: Date;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  student: Pick<User, 'id' | 'name' | 'avatar' | 'rollNumber'>;
  content?: string;
  fileUrl?: string;
  submittedAt: Date;
  marks?: number;
  grade?: string;
  feedback?: string;
  plagiarismScore?: number;
  gradedAt?: Date;
  gradedBy?: string;
}

// ─── Notes ────────────────────────────────────────────────────────────────

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  courseId?: string;
  courseName?: string;
  isPublic: boolean;
  sharedWith: string[];
  aiSummary?: string;
  flashcards?: Flashcard[];
  updatedAt: Date;
  createdAt: Date;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// ─── Quizzes ──────────────────────────────────────────────────────────────

export type QuizType = 'mcq' | 'true_false' | 'short_answer' | 'mixed';
export type QuizDifficulty = 'easy' | 'medium' | 'hard' | 'adaptive';

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: QuizType;
  options?: QuizOption[];
  correctAnswer?: string;
  explanation?: string;
  points: number;
  difficulty: QuizDifficulty;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  createdBy: string;
  questions: QuizQuestion[];
  duration: number;        // minutes
  totalPoints: number;
  difficulty: QuizDifficulty;
  isPublished: boolean;
  allowRetake: boolean;
  maxAttempts: number;
  scheduledAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface QuizResult {
  id: string;
  quizId: string;
  userId: string;
  answers: { questionId: string; answer: string; isCorrect: boolean }[];
  score: number;
  percentage: number;
  timeTaken: number;   // seconds
  grade: string;
  submittedAt: Date;
  attemptNumber: number;
}

// ─── Jobs & Placement ─────────────────────────────────────────────────────

export type JobType = 'full_time' | 'part_time' | 'internship' | 'contract' | 'remote';
export type ApplicationStatus = 'applied' | 'shortlisted' | 'interview' | 'offered' | 'rejected' | 'withdrawn';

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  type: JobType;
  salary: { min: number; max: number; currency: string };
  description: string;
  requirements: string[];
  skills: string[];
  experience: string;
  deadline: Date;
  isActive: boolean;
  postedBy: string;
  edenMatchScore?: number;    // Calculated for logged-in student
  applicantCount: number;
  createdAt: Date;
}

export interface JobApplication {
  id: string;
  jobId: string;
  job: Job;
  userId: string;
  resumeUrl?: string;
  coverLetter?: string;
  status: ApplicationStatus;
  appliedAt: Date;
  updatedAt: Date;
  notes?: string;
}

// ─── Gamification ─────────────────────────────────────────────────────────

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  color: string;
  earnedAt?: Date;
  isEarned: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt?: Date;
  isUnlocked: boolean;
  category: string;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  isCompleted: boolean;
  type: 'course' | 'quiz' | 'assignment' | 'chat' | 'login' | 'notes';
}

export interface GamificationProfile {
  userId: string;
  xp: number;
  level: number;
  nextLevelXp: number;
  streak: number;
  maxStreak: number;
  badges: Badge[];
  achievements: Achievement[];
  dailyMissions: DailyMission[];
  weeklyXp: number;
  monthlyXp: number;
  rank: number;
  totalStudents: number;
}

export interface LeaderboardEntry {
  rank: number;
  user: Pick<User, 'id' | 'name' | 'avatar' | 'department'>;
  xp: number;
  level: number;
  streak: number;
  badges: number;
  isCurrentUser?: boolean;
}

// ─── Team Workspace ───────────────────────────────────────────────────────

export type ChannelType = 'text' | 'voice' | 'announcement';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TeamMember {
  userId: string;
  user: Pick<User, 'id' | 'name' | 'avatar' | 'role'>;
  teamRole: 'leader' | 'member';
  joinedAt: Date;
  isOnline?: boolean;
}

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  description?: string;
  isPrivate: boolean;
  memberCount: number;
  lastMessage?: ChatMessage;
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  sender: Pick<User, 'id' | 'name' | 'avatar'>;
  content: string;
  type: 'text' | 'file' | 'image' | 'code' | 'system';
  attachments?: FileAttachment[];
  reactions?: MessageReaction[];
  replyTo?: string;
  editedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
}

export interface MessageReaction {
  emoji: string;
  users: string[];
  count: number;
}

export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: Pick<User, 'id' | 'name' | 'avatar'>[];
  labels: string[];
  dueDate?: Date;
  subtasks: { id: string; title: string; isCompleted: boolean }[];
  attachments?: FileAttachment[];
  createdAt: Date;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  members: TeamMember[];
  channels: Channel[];
  project?: string;
  isActive: boolean;
  createdAt: Date;
}

// ─── Events ───────────────────────────────────────────────────────────────

export type EventType = 'hackathon' | 'workshop' | 'seminar' | 'webinar' | 'contest' | 'meetup' | 'placement';

export interface Event {
  id: string;
  title: string;
  description: string;
  type: EventType;
  thumbnail?: string;
  organizer: Pick<User, 'id' | 'name' | 'avatar'>;
  startDate: Date;
  endDate: Date;
  venue?: string;
  isVirtual: boolean;
  meetingLink?: string;
  maxParticipants?: number;
  registeredCount: number;
  isRegistered?: boolean;
  prizes?: string[];
  tags: string[];
  edenMatchScore?: number;
  createdAt: Date;
}

// ─── Forum ────────────────────────────────────────────────────────────────

export type ForumCategory = 'academic' | 'career' | 'tech' | 'campus' | 'offtopic';

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: Pick<User, 'id' | 'name' | 'avatar' | 'role'>;
  category: ForumCategory;
  tags: string[];
  votes: number;
  hasVoted?: 'up' | 'down' | null;
  views: number;
  answerCount: number;
  isSolved: boolean;
  acceptedAnswerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ForumAnswer {
  id: string;
  postId: string;
  content: string;
  author: Pick<User, 'id' | 'name' | 'avatar' | 'role'>;
  votes: number;
  hasVoted?: 'up' | 'down' | null;
  isAccepted: boolean;
  createdAt: Date;
}

// ─── Notifications ────────────────────────────────────────────────────────

export type NotificationType =
  | 'assignment_due'
  | 'grade_posted'
  | 'quiz_reminder'
  | 'event_soon'
  | 'job_match'
  | 'message'
  | 'achievement'
  | 'mentor_session'
  | 'team_invite'
  | 'course_update'
  | 'system'
  | 'eden_evolution';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  description: string;
  actionUrl?: string;
  isRead: boolean;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

// ─── File Handling ────────────────────────────────────────────────────────

export type FileType = 'pdf' | 'image' | 'video' | 'document' | 'code' | 'archive' | 'other';

export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  size: number;       // bytes
  type: FileType;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
}

// ─── Analytics ────────────────────────────────────────────────────────────

export interface StudentAnalytics {
  overallGpa: number;
  attendancePercentage: number;
  coursesEnrolled: number;
  coursesCompleted: number;
  assignmentsSubmitted: number;
  quizzesTaken: number;
  averageQuizScore: number;
  xpEarned: number;
  studyHours: number;
  placementReadinessScore: number;
  gradeHistory: { month: string; gpa: number }[];
  attendanceHistory: { subject: string; percentage: number }[];
  skillRadar: { skill: string; current: number; target: number }[];
}

export interface PlatformAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  totalCourses: number;
  totalEnrollments: number;
  completionRate: number;
  averageGpa: number;
  placementRate: number;
  usersByRole: { role: UserRole; count: number }[];
  registrationTrend: { date: string; count: number }[];
  departmentPerformance: { dept: string; performance: number; students: number }[];
}

// ─── Admin ────────────────────────────────────────────────────────────────

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AuditAction =
  | 'login' | 'logout' | 'register'
  | 'create' | 'update' | 'delete'
  | 'role_change' | 'status_change'
  | 'file_upload' | 'export' | 'import'
  | 'security_alert';

export interface AuditLog {
  id: string;
  actor: Pick<User, 'id' | 'name' | 'role' | 'avatar'>;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  severity: AuditSeverity;
  description: string;
  ipAddress: string;
  userAgent?: string;
  changes?: { before: unknown; after: unknown };
  createdAt: Date;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  hodId?: string;
  hod?: Pick<User, 'id' | 'name' | 'avatar'>;
  facultyCount: number;
  studentCount: number;
  courseCount: number;
  performanceScore: number;
  performanceTrend: { month: string; score: number }[];
  createdAt: Date;
}

// ─── Mentorship ───────────────────────────────────────────────────────────

export type SessionStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'missed';

export interface MentorProfile {
  id: string;
  userId: string;
  user: Pick<User, 'id' | 'name' | 'avatar' | 'bio'>;
  expertise: string[];
  company?: string;
  designation?: string;
  linkedinUrl?: string;
  hourlyRate?: number;
  rating: number;
  reviewCount: number;
  totalSessions: number;
  availability: { day: string; slots: string[] }[];
  bio: string;
}

export interface MentorSession {
  id: string;
  mentorId: string;
  mentor: Pick<User, 'id' | 'name' | 'avatar'>;
  studentId: string;
  student: Pick<User, 'id' | 'name' | 'avatar'>;
  scheduledAt: Date;
  duration: number;    // minutes
  status: SessionStatus;
  topic: string;
  notes?: string;
  meetingLink?: string;
  rating?: number;
  feedback?: string;
}

// ─── Resume Builder ───────────────────────────────────────────────────────

export interface ResumeData {
  personal: {
    name: string;
    headline: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  summary: string;
  experience: {
    id: string;
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
    description: string;
  }[];
  education: {
    id: string;
    degree: string;
    institution: string;
    location: string;
    startYear: string;
    endYear?: string;
    gpa?: string;
    achievements?: string;
  }[];
  skills: { name: string; level: 'beginner' | 'intermediate' | 'advanced' | 'expert' }[];
  projects: {
    id: string;
    name: string;
    description: string;
    techStack: string[];
    githubUrl?: string;
    liveUrl?: string;
  }[];
  certifications: {
    id: string;
    name: string;
    issuer: string;
    date: string;
    credentialUrl?: string;
  }[];
  atsScore?: number;
  atsBreakdown?: {
    keywords: number;
    formatting: number;
    experience: number;
    skills: number;
    education: number;
  };
  template: 'classic' | 'modern' | 'minimal' | 'bold';
}

// ─── API Response Types ───────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── UI State ─────────────────────────────────────────────────────────────

export interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: ThemeMode;
  accentColor: AccentColor;
  commandPaletteOpen: boolean;
  notificationDrawerOpen: boolean;
  activeModal: string | null;
  toasts: Toast[];
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

// ─── Socket Events ────────────────────────────────────────────────────────

export interface SocketPresence {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: Date;
}

export interface SocketTyping {
  userId: string;
  userName: string;
  channelId: string;
  isTyping: boolean;
}

export interface SocketNotification {
  notification: Notification;
}

// ─── Chart Data ───────────────────────────────────────────────────────────

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  secondary?: number;
}

// ─── Role Config ──────────────────────────────────────────────────────────

export interface RoleConfig {
  role: UserRole;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  dashboardRoute: string;
  permissions: string[];
  description: string;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  student: {
    role: 'student', label: 'Student', emoji: '🎓', color: '#2563EB', bgColor: 'rgba(37,99,235,0.1)',
    dashboardRoute: '/dashboard', permissions: ['courses:read', 'assignments:submit', 'notes:crud', 'quizzes:attempt'],
    description: 'Learner with access to courses, assignments, and career tools'
  },
  faculty: {
    role: 'faculty', label: 'Faculty', emoji: '👨‍🏫', color: '#10B981', bgColor: 'rgba(16,185,129,0.1)',
    dashboardRoute: '/dashboard', permissions: ['courses:crud', 'assignments:grade', 'quizzes:create', 'students:view'],
    description: 'Educator who creates courses and manages student progress'
  },
  mentor: {
    role: 'mentor', label: 'Industry Mentor', emoji: '🤝', color: '#8B5CF6', bgColor: 'rgba(139,92,246,0.1)',
    dashboardRoute: '/dashboard', permissions: ['sessions:manage', 'students:mentor', 'reviews:write'],
    description: 'Professional mentor guiding students in career development'
  },
  admin: {
    role: 'admin', label: 'Administrator', emoji: '⚙️', color: '#F59E0B', bgColor: 'rgba(245,158,11,0.1)',
    dashboardRoute: '/dashboard', permissions: ['users:manage', 'departments:manage', 'analytics:view', 'audit:view'],
    description: 'Platform administrator with user and system management'
  },
  recruiter: {
    role: 'recruiter', label: 'Recruiter', emoji: '🏢', color: '#06B6D4', bgColor: 'rgba(6,182,212,0.1)',
    dashboardRoute: '/dashboard', permissions: ['jobs:crud', 'applications:manage', 'students:search'],
    description: 'Company recruiter posting jobs and managing applications'
  },
  parent: {
    role: 'parent', label: 'Parent', emoji: '👨‍👩‍👧', color: '#EC4899', bgColor: 'rgba(236,72,153,0.1)',
    dashboardRoute: '/dashboard', permissions: ['child:view', 'reports:view'],
    description: "Parent with read-only access to ward's academic progress"
  },
  placement_officer: {
    role: 'placement_officer', label: 'Placement Officer', emoji: '📋', color: '#F97316', bgColor: 'rgba(249,115,22,0.1)',
    dashboardRoute: '/dashboard', permissions: ['placements:manage', 'jobs:moderate', 'students:export'],
    description: 'Manages campus placements and company relationships'
  },
  hod: {
    role: 'hod', label: 'Head of Department', emoji: '🏛️', color: '#14B8A6', bgColor: 'rgba(20,184,166,0.1)',
    dashboardRoute: '/dashboard', permissions: ['department:manage', 'faculty:view', 'analytics:view'],
    description: 'Department head overseeing faculty and academic programs'
  },
  researcher: {
    role: 'researcher', label: 'Researcher', emoji: '🔬', color: '#6366F1', bgColor: 'rgba(99,102,241,0.1)',
    dashboardRoute: '/dashboard', permissions: ['research:crud', 'publications:manage', 'ai:advanced'],
    description: 'Academic researcher with access to research tools and AI'
  },
  alumni: {
    role: 'alumni', label: 'Alumni', emoji: '🌟', color: '#EAB308', bgColor: 'rgba(234,179,8,0.1)',
    dashboardRoute: '/dashboard', permissions: ['network:access', 'jobs:refer', 'mentorship:offer'],
    description: 'Graduate maintaining connections and mentoring current students'
  },
  industry_partner: {
    role: 'industry_partner', label: 'Industry Partner', emoji: '🤝', color: '#84CC16', bgColor: 'rgba(132,204,22,0.1)',
    dashboardRoute: '/dashboard', permissions: ['talent:browse', 'projects:collaborate', 'events:sponsor'],
    description: 'Industry organization partnering for talent and research'
  },
  super_admin: {
    role: 'super_admin', label: 'Super Admin', emoji: '👑', color: '#EF4444', bgColor: 'rgba(239,68,68,0.1)',
    dashboardRoute: '/dashboard', permissions: ['*'],
    description: 'Full platform access including system settings and billing'
  },
};

// ─── EDEN Stage Configs ───────────────────────────────────────────────────

export const EDEN_STAGE_CONFIGS: Record<EdenStage, EdenConfig> = {
  seed: {
    stage: 'seed', stageLabel: 'Seed', stageEmoji: '🥚',
    primaryColor: '#6B7280', glowColor: 'rgba(107,114,128,0.4)',
    personality: 'teacher', evolutionXpThreshold: 100,
    evolutionDescription: 'EDEN is just beginning to emerge...'
  },
  spark: {
    stage: 'spark', stageLabel: 'Spark', stageEmoji: '⚡',
    primaryColor: '#06B6D4', glowColor: 'rgba(6,182,212,0.4)',
    personality: 'friend', evolutionXpThreshold: 500,
    evolutionDescription: 'A spark of intelligence ignites!'
  },
  assistant: {
    stage: 'assistant', stageLabel: 'Assistant', stageEmoji: '🤖',
    primaryColor: '#2563EB', glowColor: 'rgba(37,99,235,0.4)',
    personality: 'mentor', evolutionXpThreshold: 2000,
    evolutionDescription: 'EDEN becomes your dedicated academic assistant'
  },
  mentor: {
    stage: 'mentor', stageLabel: 'Mentor', stageEmoji: '🧠',
    primaryColor: '#8B5CF6', glowColor: 'rgba(139,92,246,0.4)',
    personality: 'coach', evolutionXpThreshold: 5000,
    evolutionDescription: 'EDEN evolves into a wise academic mentor'
  },
  hologram: {
    stage: 'hologram', stageLabel: 'Hologram', stageEmoji: '🌟',
    primaryColor: '#EC4899', glowColor: 'rgba(236,72,153,0.4)',
    personality: 'career', evolutionXpThreshold: 10000,
    evolutionDescription: 'EDEN transcends into a holographic presence'
  },
  guardian: {
    stage: 'guardian', stageLabel: 'Guardian', stageEmoji: '👑',
    primaryColor: '#F59E0B', glowColor: 'rgba(245,158,11,0.5)',
    personality: 'mentor', evolutionXpThreshold: 20000,
    evolutionDescription: 'EDEN becomes your eternal academic guardian'
  },
  career: {
    stage: 'career', stageLabel: 'Career Guide', stageEmoji: '🚀',
    primaryColor: '#10B981', glowColor: 'rgba(16,185,129,0.4)',
    personality: 'career', evolutionXpThreshold: Infinity,
    evolutionDescription: 'EDEN guides your career beyond graduation'
  },
};

export default {};
