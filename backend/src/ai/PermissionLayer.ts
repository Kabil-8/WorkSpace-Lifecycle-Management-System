// EDEN AI Permission Layer — controls what each role can ask EDEN to do

const ROLE_PERMISSIONS: Record<string, Set<string>> = {
  student: new Set([
    'open_module', 'apply_job', 'submit_assignment', 'view_analytics',
    'create_quiz_attempt', 'get_recommendations', 'view_leaderboard',
    'get_my_attendance', 'get_my_assignments', 'get_my_notifications',
    'get_timetable', 'get_my_results', 'start_mock_interview', 'query_database',
    'apply_leave',
  ]),
  faculty: new Set([
    'open_module', 'create_quiz', 'mark_attendance', 'schedule_event',
    'approve_leave', 'generate_report', 'notify_students', 'create_course',
    'generate_question_paper', 'view_analytics', 'view_leaderboard',
    'get_class_attendance', 'upload_notes', 'create_assignment',
    'grade_assignment', 'get_pending_submissions', 'query_database',
  ]),
  admin: new Set([
    'open_module', 'create_quiz', 'mark_attendance', 'schedule_event',
    'approve_leave', 'generate_report', 'notify_students', 'create_course',
    'generate_question_paper', 'view_analytics', 'view_leaderboard',
    'manage_users', 'system_report', 'bulk_notify', 'create_department',
    'create_user', 'disable_user', 'broadcast_announcement',
    'get_platform_stats', 'get_audit_logs', 'query_database',
  ]),
  hod: new Set([
    'open_module', 'create_quiz', 'mark_attendance', 'schedule_event',
    'approve_leave', 'generate_report', 'notify_students', 'create_course',
    'view_analytics', 'view_leaderboard', 'manage_users', 'system_report',
    'get_department_stats', 'broadcast_announcement', 'query_database',
  ]),
  super_admin: new Set([
    'open_module', 'create_quiz', 'mark_attendance', 'schedule_event',
    'approve_leave', 'generate_report', 'notify_students', 'create_course',
    'generate_question_paper', 'view_analytics', 'view_leaderboard',
    'manage_users', 'system_report', 'bulk_notify', 'manage_departments',
    'create_department', 'create_user', 'disable_user', 'broadcast_announcement',
    'get_platform_stats', 'get_audit_logs', 'query_database',
  ]),
  mentor: new Set([
    'open_module', 'schedule_event', 'generate_report', 'view_analytics', 'notify_students',
    'get_my_assignments', 'query_database',
  ]),
  placement_officer: new Set([
    'open_module', 'schedule_event', 'notify_students', 'generate_report', 'view_analytics',
    'apply_job', 'get_recommendations', 'query_database',
  ]),
  recruiter: new Set(['open_module', 'view_analytics', 'query_database']),
  parent: new Set(['open_module', 'view_analytics', 'get_my_attendance', 'query_database']),
  alumni: new Set(['open_module', 'schedule_event', 'view_analytics', 'apply_job', 'query_database']),
  researcher: new Set(['open_module', 'view_analytics', 'generate_report', 'query_database']),
  industry_partner: new Set(['open_module', 'view_analytics', 'query_database']),
}

// All available tool declarations sent to Gemini based on the user's role
const ALL_TOOLS = [
  {
    name: 'open_module',
    description: 'Navigate the frontend to a specific module, page, or feature of EduSphere.',
    parameters: {
      type: 'OBJECT',
      properties: {
        moduleName: {
          type: 'STRING',
          description: 'Module path to open: dashboard, attendance, courses, assignments, quizzes, jobs, forum, events, gamification, compiler, resume, interview, proctor/exams, ai, analytics, notes, timetable, workspace, kanban, placement, hall-of-fame, mentorship, admin/users, admin/departments, admin/audit-logs',
        },
      },
      required: ['moduleName'],
    },
  },
  {
    name: 'query_database',
    description: 'Query platform database models and collections (users, courses, assignments, exams, events, jobs, attendance, departments, auditlogs) for live records and statistics.',
    parameters: {
      type: 'OBJECT',
      properties: {
        collection: {
          type: 'STRING',
          description: 'Collection to query: users | courses | assignments | exams | events | jobs | attendance | departments | auditlogs',
        },
        filterSubject: { type: 'STRING', description: 'Optional subject or topic filter' },
      },
      required: ['collection'],
    },
  },
  {
    name: 'create_quiz',
    description: 'Create a new quiz or proctored exam for students with AI-generated questions.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'Quiz title' },
        subject: { type: 'STRING', description: 'Subject area (e.g. Data Structures, DBMS)' },
        questionsCount: { type: 'INTEGER', description: 'Number of questions' },
        durationMinutes: { type: 'INTEGER', description: 'Duration in minutes' },
        difficulty: { type: 'STRING', description: 'easy | medium | hard | mixed' },
      },
      required: ['title', 'subject', 'questionsCount'],
    },
  },
  {
    name: 'mark_attendance',
    description: 'Mark attendance for a student or class session.',
    parameters: {
      type: 'OBJECT',
      properties: {
        studentName: { type: 'STRING', description: 'Student name (optional)' },
        subject: { type: 'STRING', description: 'Subject/course name' },
        status: { type: 'STRING', description: 'Present | Absent | Late | Medical Leave' },
      },
      required: ['subject', 'status'],
    },
  },
  {
    name: 'notify_students',
    description: 'Send a push notification to all students in the department.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'Notification title' },
        message: { type: 'STRING', description: 'Notification body content' },
        priority: { type: 'STRING', description: 'low | medium | high | urgent' },
      },
      required: ['title', 'message'],
    },
  },
  {
    name: 'broadcast_announcement',
    description: 'Broadcast a campus-wide announcement to all users (admins only).',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING' },
        message: { type: 'STRING' },
        targetRole: { type: 'STRING', description: 'all | student | faculty | admin | hod' },
        priority: { type: 'STRING', description: 'low | medium | high | urgent' },
      },
      required: ['title', 'message'],
    },
  },
  {
    name: 'schedule_event',
    description: 'Schedule a new academic, workshop, or campus event.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING' },
        description: { type: 'STRING' },
        date: { type: 'STRING', description: 'ISO date string' },
        location: { type: 'STRING' },
        category: { type: 'STRING', description: 'academic | workshop | cultural | sports | placement' },
      },
      required: ['title', 'date'],
    },
  },
  {
    name: 'approve_leave',
    description: 'Approve or reject a student leave request as Class Teacher.',
    parameters: {
      type: 'OBJECT',
      properties: {
        leaveId: { type: 'STRING', description: 'Leave request ID (optional if reviewing latest pending leave)' },
        decision: { type: 'STRING', description: 'Approved | Rejected' },
        comments: { type: 'STRING' },
      },
      required: ['decision'],
    },
  },
  {
    name: 'apply_leave',
    description: 'Apply for medical, casual, or OD leave. Automatically routes application to student\'s assigned Class Teacher for approval.',
    parameters: {
      type: 'OBJECT',
      properties: {
        leaveType: { type: 'STRING', description: 'Medical | OD | Personal | Casual | Emergency' },
        reason: { type: 'STRING', description: 'Detailed reason for leave request' },
        startDate: { type: 'STRING', description: 'ISO start date' },
        endDate: { type: 'STRING', description: 'ISO end date' },
      },
      required: ['leaveType', 'reason'],
    },
  },
  {
    name: 'generate_report',
    description: 'Generate an analytics or performance report for a given period.',
    parameters: {
      type: 'OBJECT',
      properties: {
        reportType: { type: 'STRING', description: 'attendance | performance | placement | gamification | department | audit | semester' },
        period: { type: 'STRING', description: 'weekly | monthly | semester | annual' },
        department: { type: 'STRING', description: 'Target department (optional)' },
      },
      required: ['reportType'],
    },
  },
  {
    name: 'apply_job',
    description: 'Apply for a job posting or internship on the platform.',
    parameters: {
      type: 'OBJECT',
      properties: {
        jobId: { type: 'STRING', description: 'Job posting ID' },
        jobTitle: { type: 'STRING', description: 'Job title for context' },
        companyName: { type: 'STRING' },
      },
      required: ['jobTitle'],
    },
  },
  {
    name: 'get_recommendations',
    description: 'Get personalized AI recommendations for courses, jobs, skills, or study plans.',
    parameters: {
      type: 'OBJECT',
      properties: {
        type: { type: 'STRING', description: 'courses | jobs | skills | study_plan | books | practice_problems' },
      },
      required: ['type'],
    },
  },
  {
    name: 'generate_question_paper',
    description: 'Generate a full question paper for an exam with proper structure.',
    parameters: {
      type: 'OBJECT',
      properties: {
        subject: { type: 'STRING', description: 'Subject name' },
        difficulty: { type: 'STRING', description: 'easy | medium | hard | mixed' },
        totalMarks: { type: 'INTEGER', description: 'Total marks for the paper' },
        questionTypes: { type: 'STRING', description: 'mcq | short_answer | true_false | coding | essay | mixed' },
        semester: { type: 'INTEGER', description: 'Target semester' },
      },
      required: ['subject', 'totalMarks'],
    },
  },
  {
    name: 'get_my_attendance',
    description: 'Retrieve real-time student attendance percentages, present/absent class breakdown, and exam eligibility status.',
    parameters: {
      type: 'OBJECT',
      properties: {
        subject: { type: 'STRING', description: 'Subject name filter (optional)' },
      },
    },
  },
  {
    name: 'create_assignment',
    description: 'Create a new assignment for students in a course.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING' },
        description: { type: 'STRING' },
        courseName: { type: 'STRING' },
        dueDate: { type: 'STRING', description: 'ISO date string' },
        maxMarks: { type: 'INTEGER', description: 'Maximum marks (default 100)' },
      },
      required: ['title', 'courseName', 'dueDate'],
    },
  },
  {
    name: 'get_my_assignments',
    description: 'Get pending and upcoming assignments for the current user.',
    parameters: {
      type: 'OBJECT',
      properties: {
        status: { type: 'STRING', description: 'pending | submitted | graded | overdue' },
      },
    },
  },
  {
    name: 'get_timetable',
    description: 'Retrieve the class timetable for the current student or faculty.',
    parameters: {
      type: 'OBJECT',
      properties: {
        week: { type: 'STRING', description: 'current | next (default: current)' },
      },
    },
  },
  {
    name: 'get_platform_stats',
    description: 'Get real-time platform statistics (admin/hod only).',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'start_mock_interview',
    description: 'Launch an AI-powered mock interview session for job preparation.',
    parameters: {
      type: 'OBJECT',
      properties: {
        role: { type: 'STRING', description: 'Target job role (e.g. Software Engineer, Data Analyst)' },
        difficulty: { type: 'STRING', description: 'easy | medium | hard' },
        company: { type: 'STRING', description: 'Target company for interview style (optional)' },
      },
      required: ['role'],
    },
  },
  {
    name: 'upload_notes',
    description: 'Upload study notes or materials for a course (faculty only).',
    parameters: {
      type: 'OBJECT',
      properties: {
        courseName: { type: 'STRING' },
        title: { type: 'STRING' },
        description: { type: 'STRING' },
      },
      required: ['courseName', 'title'],
    },
  },
  {
    name: 'view_analytics',
    description: 'View analytics and performance metrics for a student, class, or department.',
    parameters: {
      type: 'OBJECT',
      properties: {
        scope: { type: 'STRING', description: 'personal | class | department | platform' },
        metric: { type: 'STRING', description: 'attendance | grades | placement | engagement | all' },
      },
    },
  },
]

export class PermissionLayer {
  static canExecuteAction(role: string, action: string): boolean {
    const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.student
    return permissions.has(action)
  }

  static getAllowedTools(role: string) {
    const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.student
    const allowed = ALL_TOOLS.filter((t) => permissions.has(t.name))
    return [{ functionDeclarations: allowed }]
  }

  static getDataPermissions(role: string): string[] {
    const base = ['user_profile', 'notifications', 'events']
    const byRole: Record<string, string[]> = {
      student: [...base, 'own_attendance', 'own_assignments', 'own_gamification', 'courses', 'jobs', 'forum', 'timetable', 'own_results'],
      faculty: [...base, 'department_attendance', 'department_assignments', 'my_courses', 'exams', 'leave_requests', 'notes'],
      admin: [...base, 'platform_stats', 'all_users', 'audit_logs', 'departments', 'all_data', 'system_config'],
      hod: [...base, 'department_stats', 'department_users', 'audit_logs', 'departments', 'courses'],
      super_admin: [...base, 'platform_stats', 'all_users', 'audit_logs', 'departments', 'all_data', 'system_config'],
      mentor: [...base, 'student_assignments', 'events'],
      placement_officer: [...base, 'student_placement_data', 'jobs'],
    }
    return byRole[role] || base
  }
}
