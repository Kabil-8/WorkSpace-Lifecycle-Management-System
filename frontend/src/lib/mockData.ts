// EduSphere — Centralized Realistic Mock Data
import type {
  Course, Assignment, Job, Event, ForumPost,
  Notification, LeaderboardEntry, GamificationProfile, MentorProfile,
  KanbanTask, ChatMessage, Department, AuditLog,
} from '../types'

// ── Courses ──────────────────────────────────────────────────────────────
export const MOCK_COURSES: Course[] = [
  {
    id: 'c-001', title: 'Advanced React & TypeScript', description: 'Master modern React 19 patterns with TypeScript, hooks, and advanced state management.',
    instructor: { id: 'u-002', name: 'Dr. Sarah Mitchell' }, department: 'Computer Science',
    level: 'advanced', status: 'published', tags: ['React', 'TypeScript', 'Frontend'],
    duration: 48, enrolledCount: 342, rating: 4.8, reviewCount: 156,
    curriculum: [
      { id: 'curr-1', title: 'React Fundamentals', modules: [
        { id: 'm-1', title: 'React 19 New Features', duration: 45, type: 'video', isCompleted: true },
        { id: 'm-2', title: 'TypeScript Integration', duration: 60, type: 'video', isCompleted: true },
        { id: 'm-3', title: 'Advanced Hooks', duration: 90, type: 'video', isCompleted: false },
      ]},
      { id: 'curr-2', title: 'State Management', modules: [
        { id: 'm-4', title: 'Redux Toolkit', duration: 75, type: 'video', isCompleted: false },
        { id: 'm-5', title: 'React Query', duration: 60, type: 'video', isCompleted: false },
      ]},
    ],
    prerequisites: ['JavaScript ES6+', 'Basic React'],
    objectives: ['Build production-ready React apps', 'Master TypeScript', 'Implement complex state management'],
    language: 'English', createdAt: new Date('2024-01-10'), updatedAt: new Date(),
  },
  {
    id: 'c-002', title: 'Machine Learning Fundamentals', description: 'From basics to advanced ML algorithms with Python, scikit-learn, and TensorFlow.',
    instructor: { id: 'u-009', name: 'Dr. Lisa Wang' }, department: 'Computer Science',
    level: 'intermediate', status: 'published', tags: ['ML', 'Python', 'AI', 'Data Science'],
    duration: 64, enrolledCount: 512, rating: 4.9, reviewCount: 284,
    curriculum: [
      { id: 'curr-3', title: 'ML Basics', modules: [
        { id: 'm-6', title: 'Introduction to ML', duration: 50, type: 'video', isCompleted: true },
        { id: 'm-7', title: 'Supervised Learning', duration: 80, type: 'video', isCompleted: true },
        { id: 'm-8', title: 'Unsupervised Learning', duration: 70, type: 'video', isCompleted: false },
      ]},
    ],
    prerequisites: ['Python Basics', 'Statistics'],
    objectives: ['Understand ML algorithms', 'Build predictive models', 'Deploy ML solutions'],
    language: 'English', createdAt: new Date('2024-02-15'), updatedAt: new Date(),
  },
  {
    id: 'c-003', title: 'System Design for Engineers', description: 'Design scalable distributed systems used at companies like Google, Amazon, and Netflix.',
    instructor: { id: 'u-002', name: 'Dr. Sarah Mitchell' }, department: 'Computer Science',
    level: 'advanced', status: 'published', tags: ['System Design', 'Architecture', 'Distributed Systems'],
    duration: 36, enrolledCount: 198, rating: 4.7, reviewCount: 89,
    curriculum: [], prerequisites: ['Backend Development', 'Databases'],
    objectives: ['Design large-scale systems', 'Master CAP theorem', 'Handle millions of users'],
    language: 'English', createdAt: new Date('2024-03-01'), updatedAt: new Date(),
  },
  {
    id: 'c-004', title: 'Data Structures & Algorithms', description: 'Master DSA for competitive programming and top tech interviews.',
    instructor: { id: 'u-002', name: 'Dr. Sarah Mitchell' }, department: 'Computer Science',
    level: 'intermediate', status: 'published', tags: ['DSA', 'Algorithms', 'Competitive Programming'],
    duration: 80, enrolledCount: 678, rating: 4.9, reviewCount: 412,
    curriculum: [], prerequisites: ['Programming Basics'],
    objectives: ['Solve complex algorithmic problems', 'Ace FAANG interviews', 'Optimize time/space complexity'],
    language: 'English', createdAt: new Date('2024-01-01'), updatedAt: new Date(),
  },
  {
    id: 'c-005', title: 'Cloud Computing with AWS', description: 'Hands-on AWS training covering EC2, S3, Lambda, RDS, and microservices.',
    instructor: { id: 'u-002', name: 'Dr. Sarah Mitchell' }, department: 'Computer Science',
    level: 'intermediate', status: 'published', tags: ['AWS', 'Cloud', 'DevOps'],
    duration: 56, enrolledCount: 445, rating: 4.6, reviewCount: 203,
    curriculum: [], prerequisites: ['Linux Basics', 'Networking'],
    objectives: ['Deploy on AWS', 'Design cloud-native architectures', 'Achieve AWS certification'],
    language: 'English', createdAt: new Date('2024-02-01'), updatedAt: new Date(),
  },
  {
    id: 'c-006', title: 'Database Design & MongoDB', description: 'Master SQL and NoSQL databases, from ER diagrams to production optimization.',
    instructor: { id: 'u-002', name: 'Dr. Sarah Mitchell' }, department: 'Computer Science',
    level: 'beginner', status: 'published', tags: ['MongoDB', 'SQL', 'Database', 'Backend'],
    duration: 32, enrolledCount: 289, rating: 4.5, reviewCount: 134,
    curriculum: [], prerequisites: ['Basic Programming'],
    objectives: ['Design efficient schemas', 'Optimize queries', 'Handle large datasets'],
    language: 'English', createdAt: new Date('2024-03-15'), updatedAt: new Date(),
  },
]

// ── Assignments ──────────────────────────────────────────────────────────
export const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: 'a-001', title: 'Build a Full-Stack E-commerce App', description: 'Create a complete e-commerce platform with React frontend, Node.js backend, and MongoDB database. Must include user auth, product catalog, cart, and payment integration.',
    courseId: 'c-001', courseName: 'Advanced React & TypeScript', instructorId: 'u-002',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), maxMarks: 100,
    allowedFileTypes: ['.zip', '.pdf', '.md'], priority: 'urgent', status: 'in_progress',
    plagiarismScore: 12, createdAt: new Date(),
  },
  {
    id: 'a-002', title: 'ML Model for Student Performance Prediction', description: 'Implement a machine learning model that predicts student performance based on attendance, assignments, and previous grades. Use Random Forest and compare with Gradient Boosting.',
    courseId: 'c-002', courseName: 'Machine Learning Fundamentals', instructorId: 'u-009',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), maxMarks: 80,
    allowedFileTypes: ['.ipynb', '.pdf', '.py'], priority: 'high', status: 'todo',
    plagiarismScore: 0, createdAt: new Date(),
  },
  {
    id: 'a-003', title: 'System Design: Design Twitter', description: 'Design a Twitter-like social media platform that can handle 500M users. Include database schema, API design, caching strategy, and scalability considerations.',
    courseId: 'c-003', courseName: 'System Design for Engineers', instructorId: 'u-002',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), maxMarks: 60,
    allowedFileTypes: ['.pdf', '.docx'], priority: 'medium', status: 'todo',
    plagiarismScore: 0, createdAt: new Date(),
  },
  {
    id: 'a-004', title: 'DSA Problem Set — Dynamic Programming', description: 'Solve 15 dynamic programming problems covering knapsack, LCS, LIS, matrix chain multiplication, and tree DP. Provide time/space complexity analysis.',
    courseId: 'c-004', courseName: 'Data Structures & Algorithms', instructorId: 'u-002',
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), maxMarks: 50, marks: 42,
    allowedFileTypes: ['.pdf', '.cpp', '.py'], priority: 'urgent', status: 'graded',
    plagiarismScore: 5, createdAt: new Date('2024-06-01'),
  },
  {
    id: 'a-005', title: 'AWS Serverless Architecture', description: 'Build a serverless REST API using AWS Lambda, API Gateway, and DynamoDB. Deploy using SAM CLI.',
    courseId: 'c-005', courseName: 'Cloud Computing with AWS', instructorId: 'u-002',
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), maxMarks: 75,
    allowedFileTypes: ['.zip', '.yaml', '.pdf'], priority: 'medium', status: 'submitted',
    submittedAt: new Date(), plagiarismScore: 8, createdAt: new Date(),
  },
]

// ── Notifications ────────────────────────────────────────────────────────
export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n-001', userId: 'u-001', type: 'assignment_due', title: 'Assignment Due Tomorrow!', description: 'Build a Full-Stack E-commerce App is due in 24 hours. Submit now to avoid late penalty.', actionUrl: '/assignments', isRead: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: 'n-002', userId: 'u-001', type: 'grade_posted', title: 'New Grade Posted', description: 'You scored 42/50 in DSA Problem Set — Dynamic Programming. Great work!', actionUrl: '/assignments/a-004', isRead: false, createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) },
  { id: 'n-003', userId: 'u-001', type: 'achievement', title: '🏆 Achievement Unlocked!', description: 'You earned the "12-Day Streak" badge! Keep it up!', isRead: false, createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000) },
  { id: 'n-004', userId: 'u-001', type: 'event_soon', title: 'Hackathon Registration Open!', description: 'EduSphere HackFest 2024 registration closes in 3 days. Register now!', actionUrl: '/events', isRead: true, createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) },
  { id: 'n-005', userId: 'u-001', type: 'job_match', title: 'New Job Match Found', description: 'Frontend Developer at Google — 92% match with your profile!', actionUrl: '/jobs', isRead: true, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
  { id: 'n-006', userId: 'u-001', type: 'eden_evolution', title: '✨ EDEN is evolving!', description: 'Your EDEN companion is approaching the Mentor stage. Keep learning!', isRead: false, createdAt: new Date(Date.now() - 30 * 60 * 1000) },
]

// ── Leaderboard ───────────────────────────────────────────────────────────
export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, user: { id: 'u-101', name: 'Kavya Reddy', department: 'Computer Science' }, xp: 8920, level: 18, streak: 45, badges: 24 },
  { rank: 2, user: { id: 'u-102', name: 'Arjun Singh', department: 'Computer Science' }, xp: 7840, level: 16, streak: 38, badges: 19 },
  { rank: 3, user: { id: 'u-103', name: 'Priya Sharma', department: 'Electronics' }, xp: 7320, level: 15, streak: 32, badges: 17 },
  { rank: 4, user: { id: 'u-104', name: 'Rohit Kumar', department: 'Mechanical' }, xp: 6890, level: 14, streak: 28, badges: 15 },
  { rank: 5, user: { id: 'u-001', name: 'Alex Johnson', department: 'Computer Science' }, xp: 2450, level: 8, streak: 12, badges: 7, isCurrentUser: true },
]

// ── Events ────────────────────────────────────────────────────────────────
export const MOCK_EVENTS: Event[] = [
  { id: 'ev-001', title: 'EduSphere HackFest 2024', description: 'Build innovative solutions for education challenges in 48 hours. ₹5L prize pool!', type: 'hackathon',
    organizer: { id: 'u-004', name: 'Priya Nair' }, startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), isVirtual: false, venue: 'Main Auditorium',
    maxParticipants: 500, registeredCount: 342, isRegistered: false, prizes: ['₹2L First', '₹1.5L Second', '₹1L Third'],
    tags: ['Hackathon', 'AI', 'Innovation'], edenMatchScore: 94, createdAt: new Date() },
  { id: 'ev-002', title: 'AI/ML Workshop Series', description: 'Hands-on workshop on LLMs, RAG architecture, and building AI-powered applications.',
    type: 'workshop', organizer: { id: 'u-009', name: 'Dr. Lisa Wang' },
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
    isVirtual: true, meetingLink: 'https://meet.google.com/abc-xyz', maxParticipants: 200,
    registeredCount: 156, isRegistered: true, tags: ['AI', 'ML', 'Workshop'], edenMatchScore: 98, createdAt: new Date() },
  { id: 'ev-003', title: 'Google Campus Placement Drive', description: 'Google is visiting campus for SDE internship and full-time roles.',
    type: 'placement', organizer: { id: 'u-007', name: 'Vikram Desai' },
    startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
    isVirtual: false, venue: 'Conference Hall A', maxParticipants: 150,
    registeredCount: 89, isRegistered: false, tags: ['Placement', 'Google', 'SDE'], edenMatchScore: 87, createdAt: new Date() },
]

// ── Jobs ──────────────────────────────────────────────────────────────────
export const MOCK_JOBS: Job[] = [
  { id: 'j-001', title: 'Senior Frontend Engineer', company: 'Google', location: 'Bangalore, India', type: 'full_time',
    salary: { min: 2000000, max: 4000000, currency: 'INR' }, description: 'Build world-class web applications for Google Products.',
    requirements: ['5+ years React', 'TypeScript', 'Performance optimization'], skills: ['React', 'TypeScript', 'GraphQL', 'Testing'],
    experience: '4-6 years', deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    isActive: true, postedBy: 'u-005', edenMatchScore: 92, applicantCount: 1234, createdAt: new Date() },
  { id: 'j-002', title: 'ML Engineer', company: 'Microsoft', location: 'Hyderabad, India', type: 'full_time',
    salary: { min: 2500000, max: 5000000, currency: 'INR' }, description: 'Build ML models for Azure AI services.',
    requirements: ['Python', 'TensorFlow/PyTorch', 'MLOps'], skills: ['Python', 'ML', 'TensorFlow', 'Docker'],
    experience: '2-4 years', deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    isActive: true, postedBy: 'u-005', edenMatchScore: 88, applicantCount: 856, createdAt: new Date() },
  { id: 'j-003', title: 'Full Stack Intern', company: 'Startup Inc.', location: 'Remote', type: 'internship',
    salary: { min: 25000, max: 50000, currency: 'INR' }, description: '6-month internship building our SaaS product.',
    requirements: ['React', 'Node.js', 'MongoDB'], skills: ['React', 'Node.js', 'MongoDB', 'REST APIs'],
    experience: '0-1 years', deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    isActive: true, postedBy: 'u-005', edenMatchScore: 96, applicantCount: 234, createdAt: new Date() },
  { id: 'j-004', title: 'DevOps Engineer', company: 'Amazon', location: 'Chennai, India', type: 'full_time',
    salary: { min: 1800000, max: 3500000, currency: 'INR' }, description: 'Build and maintain CI/CD pipelines for AWS services.',
    requirements: ['AWS', 'Kubernetes', 'Terraform'], skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'],
    experience: '3-5 years', deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    isActive: true, postedBy: 'u-005', edenMatchScore: 74, applicantCount: 432, createdAt: new Date() },
]

// ── Forum Posts ────────────────────────────────────────────────────────────
export const MOCK_FORUM_POSTS: ForumPost[] = [
  { id: 'fp-001', title: 'How to implement JWT refresh token rotation securely?', content: 'I am building an auth system and confused about the best practice for refresh token rotation...',
    author: { id: 'u-001', name: 'Alex Johnson', role: 'student' }, category: 'tech',
    tags: ['Security', 'JWT', 'Auth', 'Backend'], votes: 47, views: 892, answerCount: 8, isSolved: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), updatedAt: new Date() },
  { id: 'fp-002', title: 'Best resources for GATE CSE preparation?', content: 'Targeting GATE 2025. What are the best books and resources for Data Structures, Algorithms, and OS?',
    author: { id: 'u-103', name: 'Priya Sharma', role: 'student' }, category: 'academic',
    tags: ['GATE', 'Preparation', 'Study'], votes: 34, views: 1240, answerCount: 15, isSolved: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), updatedAt: new Date() },
  { id: 'fp-003', title: 'Resume review — Applying for SDE roles at Big Tech', content: 'I have 2 years of experience and want to apply to Google, Microsoft, and Amazon. Sharing my resume for feedback.',
    author: { id: 'u-101', name: 'Kavya Reddy', role: 'student' }, category: 'career',
    tags: ['Resume', 'Interview', 'Career', 'Big Tech'], votes: 28, views: 654, answerCount: 12, isSolved: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), updatedAt: new Date() },
]

// ── Departments ────────────────────────────────────────────────────────────
export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'd-001', name: 'Computer Science', code: 'CS', description: 'Dept of CS & Engineering', hodId: 'u-008',
    hod: { id: 'u-008', name: 'Prof. Anand Kumar' }, facultyCount: 24, studentCount: 480, courseCount: 45,
    performanceScore: 88, performanceTrend: [
      { month: 'Jan', score: 82 }, { month: 'Feb', score: 84 }, { month: 'Mar', score: 83 },
      { month: 'Apr', score: 86 }, { month: 'May', score: 87 }, { month: 'Jun', score: 88 },
    ], createdAt: new Date('2010-06-01') },
  { id: 'd-002', name: 'Electronics & Communication', code: 'ECE', description: 'Dept of ECE',
    facultyCount: 18, studentCount: 360, courseCount: 38, performanceScore: 82,
    performanceTrend: [
      { month: 'Jan', score: 78 }, { month: 'Feb', score: 79 }, { month: 'Mar', score: 80 },
      { month: 'Apr', score: 81 }, { month: 'May', score: 81 }, { month: 'Jun', score: 82 },
    ], createdAt: new Date('2010-06-01') },
  { id: 'd-003', name: 'Mechanical Engineering', code: 'ME', description: 'Dept of Mechanical Engineering',
    facultyCount: 20, studentCount: 400, courseCount: 42, performanceScore: 79,
    performanceTrend: [
      { month: 'Jan', score: 74 }, { month: 'Feb', score: 75 }, { month: 'Mar', score: 76 },
      { month: 'Apr', score: 77 }, { month: 'May', score: 78 }, { month: 'Jun', score: 79 },
    ], createdAt: new Date('2010-06-01') },
  { id: 'd-004', name: 'Civil Engineering', code: 'CE', description: 'Dept of Civil Engineering',
    facultyCount: 16, studentCount: 320, courseCount: 35, performanceScore: 76,
    performanceTrend: [
      { month: 'Jan', score: 72 }, { month: 'Feb', score: 73 }, { month: 'Mar', score: 74 },
      { month: 'Apr', score: 74 }, { month: 'May', score: 75 }, { month: 'Jun', score: 76 },
    ], createdAt: new Date('2010-06-01') },
]

// ── Audit Logs ────────────────────────────────────────────────────────────
export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'al-001', actor: { id: 'u-001', name: 'Alex Johnson', role: 'student' }, action: 'login', resource: 'Auth', severity: 'info', description: 'User logged in successfully', ipAddress: '192.168.1.101', createdAt: new Date(Date.now() - 5 * 60 * 1000) },
  { id: 'al-002', actor: { id: 'u-004', name: 'Priya Nair', role: 'admin' }, action: 'role_change', resource: 'User', resourceId: 'u-103', severity: 'warning', description: 'Changed user role from student to alumni', ipAddress: '10.0.0.5', changes: { before: { role: 'student' }, after: { role: 'alumni' } }, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: 'al-003', actor: { id: 'u-012', name: 'System', role: 'super_admin' }, action: 'security_alert', resource: 'Auth', severity: 'critical', description: 'Multiple failed login attempts detected from IP 203.45.67.89', ipAddress: '203.45.67.89', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) },
  { id: 'al-004', actor: { id: 'u-002', name: 'Dr. Sarah Mitchell', role: 'faculty' }, action: 'create', resource: 'Assignment', resourceId: 'a-001', severity: 'info', description: 'Created new assignment: Build a Full-Stack E-commerce App', ipAddress: '10.0.0.12', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
  { id: 'al-005', actor: { id: 'u-004', name: 'Priya Nair', role: 'admin' }, action: 'export', resource: 'Users', severity: 'warning', description: 'Exported 480 student records to CSV', ipAddress: '10.0.0.5', createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) },
]

// ── Mentor Profiles ────────────────────────────────────────────────────────
export const MOCK_MENTOR_PROFILES: MentorProfile[] = [
  { id: 'mp-001', userId: 'u-003', user: { id: 'u-003', name: 'Rahul Sharma', bio: 'Senior SWE at Google. 10+ years experience.' },
    expertise: ['System Design', 'Algorithms', 'Career Guidance', 'Interview Prep'], company: 'Google', designation: 'Senior Software Engineer',
    linkedinUrl: 'https://linkedin.com/in/rahul-sharma', hourlyRate: 2000, rating: 4.9, reviewCount: 84,
    totalSessions: 120, availability: [{ day: 'Saturday', slots: ['10:00', '14:00', '16:00'] }, { day: 'Sunday', slots: ['11:00', '15:00'] }],
    bio: 'Senior SWE at Google with 10+ years. I love helping students crack top tech interviews and grow their careers.' },
  { id: 'mp-002', userId: 'u-010', user: { id: 'u-010', name: 'Arjun Mehta', bio: 'SDE-II at Amazon. Class of 2022.' },
    expertise: ['Java', 'AWS', 'Backend Development', 'Resume Review'], company: 'Amazon', designation: 'SDE-II',
    linkedinUrl: 'https://linkedin.com/in/arjun-mehta', hourlyRate: 1500, rating: 4.7, reviewCount: 42,
    totalSessions: 56, availability: [{ day: 'Friday', slots: ['18:00', '20:00'] }, { day: 'Saturday', slots: ['10:00', '14:00'] }],
    bio: 'Passionate about backend systems and cloud architecture. Ready to help you land your dream job!' },
]

// ── Kanban Tasks ──────────────────────────────────────────────────────────
export const MOCK_KANBAN_TASKS: KanbanTask[] = [
  { id: 'kt-001', title: 'Design database schema', status: 'done', priority: 'high', assignees: [{ id: 'u-001', name: 'Alex Johnson' }], labels: ['backend', 'database'], dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), subtasks: [{ id: 'st-1', title: 'User table', isCompleted: true }, { id: 'st-2', title: 'Courses table', isCompleted: true }], createdAt: new Date() },
  { id: 'kt-002', title: 'Implement REST API endpoints', status: 'in_progress', priority: 'high', assignees: [{ id: 'u-001', name: 'Alex Johnson' }], labels: ['backend', 'api'], dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), subtasks: [{ id: 'st-3', title: 'Auth endpoints', isCompleted: true }, { id: 'st-4', title: 'Course endpoints', isCompleted: false }, { id: 'st-5', title: 'Assignment endpoints', isCompleted: false }], createdAt: new Date() },
  { id: 'kt-003', title: 'Build React UI components', status: 'in_progress', priority: 'medium', assignees: [{ id: 'u-102', name: 'Arjun Singh' }], labels: ['frontend', 'ui'], dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), subtasks: [{ id: 'st-6', title: 'Dashboard', isCompleted: true }, { id: 'st-7', title: 'Course list', isCompleted: false }], createdAt: new Date() },
  { id: 'kt-004', title: 'Write unit tests', status: 'todo', priority: 'medium', assignees: [], labels: ['testing'], dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), subtasks: [], createdAt: new Date() },
  { id: 'kt-005', title: 'Deploy to production', status: 'backlog', priority: 'critical', assignees: [], labels: ['devops'], dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), subtasks: [], createdAt: new Date() },
  { id: 'kt-006', title: 'Documentation', status: 'backlog', priority: 'low', assignees: [], labels: ['docs'], subtasks: [], createdAt: new Date() },
]

// ── Resume ────────────────────────────────────────────────────────────────
export const MOCK_RESUME = {
  projects: [
    { name: 'EduSphere SaaS', description: 'AI-Powered Student Lifecycle Ecosystem', technologies: ['React 19', 'TypeScript', 'Node.js', 'MongoDB', 'Socket.IO'] },
    { name: 'E-Commerce Platform', description: 'Full-stack online store with Stripe payment gateway', technologies: ['Next.js', 'TailwindCSS', 'PostgreSQL'] },
  ],
}

// ── Chat Messages ─────────────────────────────────────────────────────────
export const MOCK_MESSAGES: ChatMessage[] = [
  { id: 'msg-001', channelId: 'ch-001', sender: { id: 'u-001', name: 'Alex Johnson' }, content: 'Hey team! Has anyone started on the REST API implementation?', type: 'text', reactions: [{ emoji: '👋', users: ['u-102'], count: 1 }], createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: 'msg-002', channelId: 'ch-001', sender: { id: 'u-102', name: 'Arjun Singh' }, content: 'Yes! I finished the auth endpoints. Working on courses now 🚀', type: 'text', reactions: [{ emoji: '🔥', users: ['u-001', 'u-103'], count: 2 }], createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000) },
  { id: 'msg-003', channelId: 'ch-001', sender: { id: 'u-103', name: 'Priya Sharma' }, content: "Great! I'll handle the frontend components. Should we use React Query for data fetching?", type: 'text', createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) },
  { id: 'msg-004', channelId: 'ch-001', sender: { id: 'u-001', name: 'Alex Johnson' }, content: "Absolutely! React Query + Axios is the way to go. I'll set up the Axios instance with interceptors.", type: 'text', reactions: [{ emoji: '✅', users: ['u-102', 'u-103'], count: 2 }], createdAt: new Date(Date.now() - 45 * 60 * 1000) },
  { id: 'msg-005', channelId: 'ch-001', sender: { id: 'u-102', name: 'Arjun Singh' }, content: 'Just pushed the courses API to the dev branch. Review when you can!', type: 'text', createdAt: new Date(Date.now() - 15 * 60 * 1000) },
]

// ── Gamification Profile ──────────────────────────────────────────────────
export const MOCK_GAMIFICATION: GamificationProfile = {
  userId: 'u-001',
  xp: 2450, level: 8,
  nextLevelXp: 3600,
  streak: 12, maxStreak: 21,
  badges: [
    { id: 'b-001', name: 'First Login', description: 'Logged in for the first time', icon: '🎯', rarity: 'common', color: '#94A3B8', isEarned: true, earnedAt: new Date('2024-01-01') },
    { id: 'b-002', name: 'Verified Scholar', description: 'Verified your email', icon: '✅', rarity: 'common', color: '#94A3B8', isEarned: true, earnedAt: new Date('2024-01-01') },
    { id: 'b-003', name: 'Week Warrior', description: '7-day learning streak', icon: '🔥', rarity: 'rare', color: '#2563EB', isEarned: true, earnedAt: new Date('2024-02-15') },
    { id: 'b-004', name: 'Code Ninja', description: 'Completed 10 coding challenges', icon: '🥷', rarity: 'rare', color: '#2563EB', isEarned: true, earnedAt: new Date('2024-03-01') },
    { id: 'b-005', name: 'Top 10%', description: 'Ranked in top 10% of your batch', icon: '🏆', rarity: 'epic', color: '#8B5CF6', isEarned: true, earnedAt: new Date('2024-04-01') },
    { id: 'b-006', name: 'AI Explorer', description: 'Used EDEN 50 times', icon: '🤖', rarity: 'epic', color: '#8B5CF6', isEarned: true, earnedAt: new Date('2024-05-01') },
    { id: 'b-007', name: 'Hackathon Champion', description: 'Won a hackathon', icon: '🏅', rarity: 'legendary', color: '#F59E0B', isEarned: false },
    { id: 'b-008', name: 'Perfect Score', description: 'Got 100% on a quiz', icon: '💯', rarity: 'legendary', color: '#F59E0B', isEarned: false },
  ],
  achievements: [
    { id: 'ac-001', title: 'First Assignment Submitted', description: 'Submitted your first assignment', icon: '📝', xpReward: 50, isUnlocked: true, unlockedAt: new Date('2024-01-15'), category: 'Academic' },
    { id: 'ac-002', title: 'Course Enrolled', description: 'Enrolled in your first course', icon: '📚', xpReward: 100, isUnlocked: true, unlockedAt: new Date('2024-01-10'), category: 'Academic' },
    { id: 'ac-003', title: 'Social Butterfly', description: 'Made 5 forum posts', icon: '🦋', xpReward: 150, isUnlocked: false, category: 'Social' },
  ],
  dailyMissions: [
    { id: 'dm-001', title: 'Complete a lesson', description: 'Watch or read one course lesson', xpReward: 25, isCompleted: true, type: 'course' },
    { id: 'dm-002', title: 'Take a quiz', description: 'Complete any quiz', xpReward: 50, isCompleted: false, type: 'quiz' },
    { id: 'dm-003', title: 'Chat with EDEN', description: 'Send 3 messages to EDEN', xpReward: 30, isCompleted: false, type: 'chat' },
    { id: 'dm-004', title: 'Login today', description: 'Maintain your streak', xpReward: 10, isCompleted: true, type: 'login' },
    { id: 'dm-005', title: 'Make a forum post', description: 'Ask or answer in the forum', xpReward: 40, isCompleted: false, type: 'notes' },
  ],
  weeklyXp: 380, monthlyXp: 1200, rank: 5, totalStudents: 480,
}

// ── Performance Chart Data ─────────────────────────────────────────────────
export const MOCK_GRADE_HISTORY = [
  { month: 'Jan', gpa: 7.2 }, { month: 'Feb', gpa: 7.5 },
  { month: 'Mar', gpa: 7.8 }, { month: 'Apr', gpa: 7.4 },
  { month: 'May', gpa: 8.1 }, { month: 'Jun', gpa: 8.4 },
  { month: 'Jul', gpa: 8.2 }, { month: 'Aug', gpa: 8.7 },
]

export const MOCK_ATTENDANCE_HISTORY = [
  { subject: 'Advanced React', percentage: 91 },
  { subject: 'Machine Learning', percentage: 85 },
  { subject: 'System Design', percentage: 78 },
  { subject: 'DSA', percentage: 94 },
  { subject: 'Cloud Computing', percentage: 71 },
]

export const MOCK_PLATFORM_STATS = {
  totalUsers: 2847,
  activeUsers: 1243,
  newUsersToday: 34,
  newUsersThisWeek: 187,
  totalCourses: 156,
  totalEnrollments: 8934,
  completionRate: 68,
  averageGpa: 7.8,
  placementRate: 94,
}

export const MOCK_USER_ROLE_DISTRIBUTION = [
  { role: 'student', count: 2340 }, { role: 'faculty', count: 89 },
  { role: 'mentor', count: 124 }, { role: 'admin', count: 12 },
  { role: 'recruiter', count: 78 }, { role: 'alumni', count: 156 },
  { role: 'other', count: 48 },
]

export const MOCK_WEEKLY_REGISTRATIONS = [
  { date: 'Mon', count: 23 }, { date: 'Tue', count: 31 },
  { date: 'Wed', count: 28 }, { date: 'Thu', count: 45 },
  { date: 'Fri', count: 38 }, { date: 'Sat', count: 19 },
  { date: 'Sun', count: 15 },
]
