# EduSphere — Full Stack Master Implementation Plan
## Node.js + Express + MongoDB Backend · React 19 + React Bits Frontend · EDEN AI Core

---

## 📋 Current Baseline (What Already Exists)

| Asset | Status | Notes |
|---|---|---|
| React 19 + Vite + TypeScript + TailwindCSS | ✅ Configured | — |
| Radix UI (full set) + Recharts + Framer Motion | ✅ Installed | — |
| Redux Toolkit (authSlice + uiSlice) | ✅ Live | — |
| AuthContext with 4 mock roles | ✅ Live | Expand to 12 |
| AppShell + Floating Dock + CommandPalette | ✅ Live | Expand navigation |
| Animation library (BlurText, SplitText, Typewriter, FadeIn, Spotlight, TiltCard, Bounce, ScaleIn, BorderGlow, ClickSpark, Marquee, BentoGrid, CountUp, Magnetic, Trail, Strands, Aurora, Silk, Antigravity, Dock) | ✅ Live | 17,577 bytes |
| 732-line TypeScript type system | ✅ Comprehensive | Expand with EDEN + 12-role types |
| CSS design token system | ✅ Live | Exact spec colors |
| StudentDashboard, FacultyDashboard, MentorDashboard, AdminDashboard | ✅ Live | Full Bento rebuild |
| SmartNotes, CodingPlayground, QuizHub, AICopilot, TeamWorkspace | ✅ Live | Enhance all |
| GeneralViews (Courses, PlacementHub, Mentorship, Events, Gradebook…) | ✅ Live | 39 KB |
| socket.io-client, axios, react-hook-form, zod, react-query | ✅ Installed | Wire to real backend |

> [!IMPORTANT]
> **User Decisions (confirmed):**
> - **Backend**: Node.js + Express + MongoDB built concurrently with frontend
> - **React Bits**: Every single page must use at least 3 React Bits components
> - **All 12 Roles**: Full role system with dashboards for every role
> - **EDEN Avatar**: Premium 2D animated hologram companion (Framer Motion + CSS)

---

## 🏗️ Complete Monorepo Target Structure

```
EduSphere/                            ← Workspace root
├── frontend/                         ← React 19 + Vite (existing, expand)
│   └── src/
│       ├── components/
│       │   ├── animations/           ← ✅ EXISTS — add more React Bits wrappers
│       │   ├── layout/               ← ✅ EXISTS — AppShell, CommandPalette
│       │   ├── ui/                   ← [NEW] Button, Badge, Card, Modal, Drawer
│       │   ├── cards/                ← [NEW] StatCard, CourseCard, JobCard, EventCard
│       │   ├── charts/               ← [NEW] AreaChart, BarChart, RadialChart, HeatMap
│       │   ├── eden/                 ← [NEW] EDEN companion system
│       │   │   ├── EdenCompanion.tsx
│       │   │   ├── EdenChat.tsx
│       │   │   └── EdenStageEngine.ts
│       │   ├── widgets/              ← [NEW] Dashboard bento widgets
│       │   ├── tables/               ← [NEW] DataTable + pagination
│       │   └── forms/                ← [NEW] RHF + Zod field wrappers
│       ├── pages/
│       │   ├── dashboard/            ← ✅ EXISTS — full Bento rebuild (all 4)
│       │   ├── academic/             ← [NEW] 6 pages
│       │   ├── career/               ← [NEW] 5 pages
│       │   ├── collaboration/        ← [NEW] 2 pages (Kanban, Forum)
│       │   ├── campus/               ← [NEW] 3 pages
│       │   ├── gamification/         ← [NEW] 1 page
│       │   ├── analytics/            ← [NEW] 2 pages
│       │   ├── admin/                ← [NEW] 4 pages
│       │   ├── eden/                 ← [NEW] 2 pages
│       │   └── roles/                ← [NEW] 8 additional role dashboards
│       ├── services/                 ← [NEW] Axios API service layer
│       ├── hooks/                    ← [NEW] Custom React hooks
│       ├── store/
│       │   ├── authSlice.ts          ← ✅ EXISTS (expand 12 roles)
│       │   ├── uiSlice.ts            ← ✅ EXISTS
│       │   ├── edenSlice.ts          ← [NEW]
│       │   └── coursesSlice.ts       ← [NEW]
│       ├── contexts/
│       │   ├── AuthContext.tsx       ← ✅ EXISTS (expand + real API calls)
│       │   ├── ThemeContext.tsx      ← ✅ EXISTS
│       │   └── EdenContext.tsx       ← [NEW]
│       ├── types/
│       │   ├── index.ts              ← ✅ EXISTS (add 12-role types)
│       │   └── eden.types.ts         ← [NEW] EDEN-specific types
│       └── lib/
│           ├── utils.ts              ← ✅ EXISTS
│           └── mock-data.ts          ← [NEW] Centralized realistic mock data
│
├── backend/                          ← [NEW] Full Node.js + Express + TypeScript
│   └── src/
│       ├── app.ts                    ← Express app factory
│       ├── server.ts                 ← HTTP + Socket.IO entry point
│       ├── config/
│       │   ├── db.ts                 ← MongoDB/Mongoose connection
│       │   ├── redis.ts              ← ioredis client
│       │   └── env.ts                ← Zod env validation
│       ├── models/                   ← 16 Mongoose schemas
│       ├── controllers/              ← 16 controllers
│       ├── routes/                   ← 15 route files + master index
│       ├── middlewares/              ← auth, rbac, validate, rateLimiter, upload, audit
│       ├── services/                 ← eden, mail, upload, analytics, notification
│       ├── socket/                   ← Socket.IO namespaces + handlers
│       ├── utils/                    ← asyncHandler, apiResponse, logger, jwt
│       └── seed/                     ← Seed scripts for all collections
│
├── docker-compose.yml                ← [NEW] Frontend + Backend + MongoDB + Redis
├── .github/workflows/ci.yml          ← [NEW] GitHub Actions CI/CD
├── .env.example                      ← [NEW] Environment template
└── README.md                         ← [NEW] Complete setup guide
```

---

## 🚀 Execution Phases

---

## Phase 0 — Backend Scaffold & Database

### 0.1 — Project Initialization

```bash
# From EduSphere/ root
mkdir backend && cd backend
npm init -y
npm install express typescript ts-node-dev mongoose ioredis socket.io \
  jsonwebtoken bcryptjs multer nodemailer express-rate-limit helmet cors \
  compression morgan winston zod uuid
npm install -D @types/express @types/node @types/jsonwebtoken @types/bcryptjs \
  @types/multer @types/nodemailer @types/morgan @types/cors @types/compression @types/uuid
```

Backend `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "baseUrl": "./src",
    "paths": { "@/*": ["./*"] }
  }
}
```

---

### 0.2 — Environment Configuration

#### [NEW] `.env.example` (workspace root)
```env
# Server
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# MongoDB
MONGO_URI=mongodb://localhost:27017/edusphere

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# AI (OpenAI)
OPENAI_API_KEY=
```

#### [NEW] `backend/src/config/env.ts`
Zod schema validating all required env vars — throws descriptive error at startup if any are missing.

#### [NEW] `backend/src/config/db.ts`
```typescript
// Mongoose connection with:
// - Retry logic (5 attempts with 5s delay)
// - Connection pool: maxPoolSize: 10
// - Auto-index creation disabled in production
// - Graceful shutdown on SIGTERM
```

---

### 0.3 — Mongoose Models (16 Schemas)

#### [NEW] `backend/src/models/User.model.ts`
```
Fields:
  name, email, password (bcrypt hashed, select:false),
  role: enum[student|faculty|mentor|recruiter|parent|placement_officer|
             hod|admin|researcher|alumni|industry_partner|super_admin],
  avatar, department, bio, phone,
  rollNumber (students only), employeeId (faculty/staff only),
  skills[], xp, level, badges[], streak, maxStreak, lastActive,
  isVerified, isActive, mfaEnabled, mfaSecret, deviceTokens[],
  preferences: { theme, accentColor, notifications:{email,push,inApp}, language, timezone },
  edenStage: enum[seed|spark|assistant|mentor|hologram|guardian|career],
  timestamps (createdAt, updatedAt)

Indexes: email (unique), role, department, isActive
Methods: comparePassword(candidate), toJSON() (strips password)
Statics: findByEmail(email), findByRole(role)
```

#### [NEW] `backend/src/models/Eden.model.ts`
```
Fields:
  user: ObjectId (ref:User, unique),
  stage: enum[seed|spark|assistant|mentor|hologram|guardian|career],
  personality: enum[teacher|friend|mentor|coach|career_guide],
  xpMilestone: Number,
  conversationHistory: [{ role:string, content:string, timestamp:Date }],
  memoryContext: {
    academicSummary: String,
    careerGoals: String,
    weakPoints: String[],
    strengths: String[],
    recentAchievements: String[]
  },
  lastInteraction: Date,
  evolutionHistory: [{ stage, triggeredAt, trigger:String }]

Indexes: user (unique)
```

#### [NEW] All remaining 14 models:
`Course`, `Enrollment`, `Assignment`, `Submission`, `Note`, `Quiz`, `QuizResult`,
`Job`, `JobApplication`, `Notification`, `Team`, `Message`, `Event`, `ForumPost`,
`AuditLog`, `MentorProfile`, `MentorSession`, `GamificationProfile`

Each model follows consistent patterns:
- `timestamps: true` on all schemas
- Appropriate compound indexes for query patterns
- Virtuals for computed fields (e.g., `enrolledCount` on Course)
- `toJSON` transformations to clean up `_id` → `id`, remove `__v`

---

### 0.4 — Auth Controller & Routes

#### [NEW] `backend/src/controllers/auth.controller.ts`

```
POST   /api/auth/register
  → validate body (name, email, password, role, department?)
  → check email uniqueness
  → bcrypt hash password (rounds: 12)
  → create User
  → create Eden companion record (stage: 'seed')
  → create GamificationProfile (xp:0, level:1)
  → send verification email (Nodemailer)
  → return: { user, token, refreshToken }

POST   /api/auth/login
  → find user by email (include password)
  → compare password
  → generate JWT (15m) + refreshToken (7d)
  → store refreshToken hash in Redis (key: refresh:{userId})
  → update lastActive
  → return: { user, token, refreshToken }

POST   /api/auth/refresh
  → validate refreshToken from body/cookie
  → check Redis for stored hash
  → generate new JWT
  → return: { token }

POST   /api/auth/logout
  → add JWT to Redis blacklist (key: blacklist:{jti}, TTL: expiry)
  → delete refreshToken from Redis
  → return: { success: true }

GET    /api/auth/me
  → requires: protect middleware
  → return: populated user object

POST   /api/auth/forgot-password
  → generate 6-digit OTP, store in Redis (TTL: 10min)
  → send OTP via Nodemailer
  → return: { message: 'OTP sent' }

POST   /api/auth/reset-password
  → validate OTP from Redis
  → hash new password, update User
  → invalidate all refresh tokens
  → return: { success: true }

POST   /api/auth/verify-email
  → validate token from query param
  → set isVerified: true
  → award 100 XP + 'Verified' badge via gamification service
```

---

### 0.5 — RBAC Middleware

#### [NEW] `backend/src/middlewares/rbac.middleware.ts`
```typescript
// protect: verifies JWT, checks Redis blacklist, attaches req.user
export const protect = asyncHandler(async (req, res, next) => { ... });

// authorize: role gate, supports multiple roles
export const authorize = (...roles: UserRole[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Forbidden: insufficient permissions'));
    }
    next();
  };

// auditLog: auto-writes to AuditLog model after successful requests
export const auditLog = (action: string) => async (req, res, next) => { ... };
```

---

### 0.6 — All API Routes

#### Routes structure (15 route files + master aggregator):

**Auth** (`/api/auth`): register, login, refresh, logout, me, forgot-password, reset-password, verify-email

**Users** (`/api/users`):
- `GET /` — admin/super_admin: paginated list with filters (role, dept, status, search)
- `GET /:id` — any authenticated
- `PUT /:id` — self or admin
- `PUT /:id/role` — admin, super_admin
- `PUT /:id/status` — admin (activate/deactivate)
- `DELETE /:id` — super_admin (soft delete)

**Courses** (`/api/courses`):
- `GET /` — paginated with filters
- `POST /` — faculty, admin
- `GET /:id` — populated detail (modules, instructor)
- `PUT /:id` — instructor or admin
- `DELETE /:id` — admin (soft delete)
- `POST /:id/enroll` — student
- `DELETE /:id/unenroll` — student
- `GET /:id/progress` — student progress object
- `PUT /:id/progress` — update lesson progress

**Assignments** (`/api/assignments`):
- Full CRUD (faculty/admin create, students submit)
- `POST /:id/submit` — file upload + text
- `PUT /submissions/:sid/grade` — faculty grades submission
- `GET /:id/submissions` — faculty sees all submissions

**Notes** (`/api/notes`):
- Full CRUD (owned by user)
- `POST /:id/ai-summary` — triggers EDEN summarization
- `POST /:id/share` — share with user IDs

**Quizzes** (`/api/quizzes`):
- Full CRUD (faculty creates)
- `POST /:id/attempt` — student submits answers, auto-graded
- `GET /:id/results` — student sees own results, faculty sees all

**Jobs** (`/api/jobs`):
- Full CRUD (recruiter/placement_officer create)
- `POST /:id/apply` — student applies with resume URL
- `GET /my-applications` — student's application list
- `PUT /applications/:id/status` — recruiter updates status

**Notifications** (`/api/notifications`):
- `GET /` — user's notifications (paginated)
- `PUT /:id/read` — mark read
- `PUT /read-all` — mark all read

**Teams** (`/api/teams`):
- Full CRUD + invite by code + kick member

**Chat** (`/api/chat`):
- `GET /channels/:id/messages` — paginated message history

**Events** (`/api/events`):
- Full CRUD + `POST /:id/register` + `DELETE /:id/unregister`

**Forum** (`/api/forum`):
- Full CRUD for posts + answers + voting + accept-answer

**Admin** (`/api/admin`):
- `GET /stats` — platform overview numbers
- `GET /audit-logs` — paginated AuditLog with filters
- `GET /departments` — department performance data
- `POST /departments` — create department
- `GET /system-settings` — system config
- `PUT /system-settings` — update config

**Analytics** (`/api/analytics`):
- `GET /student/:id` — performance, attendance, XP timeline
- `GET /admin/overview` — platform-wide metrics
- `GET /admin/predictions` — heuristic risk predictions

**EDEN** (`/api/eden`):
- `GET /me` — fetch user's EDEN companion state + history
- `POST /chat` — message exchange with EDEN (OpenAI or rule-based fallback)
- `GET /insights` — 3-5 daily personalized AI insights
- `POST /evolve` — trigger evolution stage check

**Gamification** (`/api/gamification`):
- `GET /profile/:userId` — XP, level, badges, streak, achievements
- `POST /award-xp` — internal service call (also called from other controllers)
- `GET /leaderboard` — top 50 by XP

---

### 0.7 — Socket.IO Real-Time Server

#### [NEW] `backend/src/socket/socket.ts`
```typescript
// Namespaces:
//   /chat       — team/DM messaging
//   /notify     — push notifications per user
//   /presence   — online/offline/idle tracking

// Auth middleware on connection:
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const user = verifyJWT(token);
  socket.data.user = user;
  next();
});
```

#### [NEW] `backend/src/socket/chat.handler.ts`
Events handled:
- `join_room(channelId)` — join Socket.IO room
- `send_message({channelId, content, type, attachments?})` — persist to DB, broadcast
- `typing_start(channelId)` — broadcast to room (excluding sender)
- `typing_stop(channelId)`
- `message_reaction({messageId, emoji})` — toggle reaction, update DB, broadcast
- `message_delete(messageId)` — soft delete, broadcast

#### [NEW] `backend/src/socket/presence.handler.ts`
- On connect: set user presence to 'online' in Redis hash
- On disconnect: set 'offline', update lastActive in DB
- Broadcast presence changes to all connected users

---

### 0.8 — Seed Data

#### [NEW] `backend/src/seed/index.ts` (master runner)
Sequentially seeds:
1. Users (50 students, 10 faculty, 5 mentors, 3 admins, 3 recruiters, 5 alumni, 3 placement officers, 2 HODs, 1 super_admin)
2. Courses (20 courses, 5 departments, modules + lessons)
3. Enrollments (each student enrolled in 3-5 courses)
4. Assignments (50 assignments, mix of submitted/graded)
5. Quizzes (30 quizzes with questions)
6. Jobs (100 job listings, 200 applications)
7. Events (20 events, hackathons + workshops)
8. Teams (5 teams with channels + messages)
9. Forum posts (40 posts with answers)
10. Audit logs (200 entries)
11. Gamification profiles (XP + badges + achievements for all users)
12. EDEN companion states (users at various stages)

---

## Phase 1 — EDEN AI Core (Frontend)

### 1.1 — EDEN Types

#### [NEW] `frontend/src/types/eden.types.ts`
```typescript
export type EdenStage =
  | 'seed'       // 🥚 Day 1
  | 'spark'      // 🐣 Week 1
  | 'assistant'  // 🤖 Month 1
  | 'mentor'     // 🧠 Semester 1
  | 'hologram'   // 🌟 Year 2
  | 'guardian'   // 👨‍🏫 Graduation
  | 'career';    // 🚀 Post-grad

export type EdenPersonality = 'teacher' | 'friend' | 'mentor' | 'coach' | 'career';

export interface EdenConfig {
  stage: EdenStage;
  stageLabel: string;
  stageEmoji: string;
  primaryColor: string;
  glowColor: string;
  personality: EdenPersonality;
  evolutionXpThreshold: number;
}

export interface EdenMessage {
  id: string;
  role: 'user' | 'eden';
  content: string;
  timestamp: Date;
  mode?: string;
}
```

---

### 1.2 — EDEN Redux Slice

#### [NEW] `frontend/src/store/edenSlice.ts`

State:
```typescript
interface EdenState {
  stage: EdenStage;            // Current stage
  personality: EdenPersonality;
  isOpen: boolean;             // Is EDEN chat panel open
  isMinimized: boolean;
  messages: EdenMessage[];     // Full conversation history
  insights: string[];          // Daily personalized insights
  greeting: string;            // Personalized greeting for today
  isTyping: boolean;           // EDEN is composing response
  evolutionProgress: number;   // 0-100% toward next stage
  unreadCount: number;
}
```

Reducers: `setStage`, `setPersonality`, `toggleOpen`, `minimizePanel`,
`addUserMessage`, `addEdenMessage`, `setInsights`, `setGreeting`,
`setTyping`, `setEvolutionProgress`, `incrementUnread`, `clearUnread`

---

### 1.3 — EDEN Context

#### [NEW] `frontend/src/contexts/EdenContext.tsx`
```typescript
// On AuthContext user change → load EDEN state from /api/eden/me
// Computes greeting: time-of-day + user name + activity-based motivational message
// sendMessage: POST /api/eden/chat → stream tokens into addEdenMessage
// getInsights: GET /api/eden/insights → store in Redux
// triggerEvolutionCheck: compare XP/streak against EdenStageEngine thresholds
// Fallback (no backend): rich rule-based response engine per personality mode
```

**Stage Thresholds (EdenStageEngine):**
| Stage | From | Trigger |
|---|---|---|
| seed | Day 1 | Account created |
| spark | Week 1 | 7+ days active OR 100 XP |
| assistant | Month 1 | 30+ days active OR 500 XP |
| mentor | Semester 1 | 180+ days OR 2000 XP |
| hologram | Year 2 | 365+ days OR 5000 XP |
| guardian | Graduation | Graduation event trigger |
| career | Post-grad | Alumni role assigned |

---

### 1.4 — EDEN Floating Companion Widget

#### [NEW] `frontend/src/components/eden/EdenCompanion.tsx`

Visual representation per stage using CSS art + Framer Motion:

| Stage | Visual | Colors |
|---|---|---|
| seed | Pulsing egg shape, cracks animate on hover | gray → green glow |
| spark | Electric orb, spark particles emit outward | cyan, electric blue |
| assistant | Floating robot face, animated eye blink, antenna pulse | #2563EB blue ring |
| mentor | Cloaked figure silhouette, gentle float, wisdom glow | #8B5CF6 purple |
| hologram | Prismatic scanline shimmer, refraction rings | Rainbow gradient |
| guardian | Crown + wing silhouette, golden radiance | #F59E0B gold |
| career | Rocket + trail + star field comet effect | Rainbow gradient |

Behaviors:
- Fixed position `bottom-6 right-24` (left of the Dock)
- Framer Motion `AnimatePresence` for stage morph transitions
- Click → expand `EdenChat` panel (`AnimatePresence` slide-up)
- Unread badge counter (red dot with number)
- Stage name label below avatar
- Mini XP progress bar toward next stage
- Idle state: gentle float animation loop (Framer Motion `animate` loop)
- Hover state: brighten glow, show "Talk to EDEN" tooltip

---

### 1.5 — EDEN Chat Panel

#### [NEW] `frontend/src/components/eden/EdenChat.tsx`

Layout (400px × full-height slide panel):
- **Header**: EDEN stage name + avatar + personality switcher tabs
- **Chat area**: Scrollable bubble messages (user right, EDEN left)
  - EDEN messages use `Typewriter` component from React Bits for streaming feel
  - Code blocks syntax highlighted inline
  - Timestamps on hover
- **Typing indicator**: Three animated dots (CSS keyframe pulse)
- **Quick Prompts**: Horizontal chip row — "Summarize my week" | "Create study plan" | "Review my code" | "Fix my resume" | "Motivate me"
- **Input**: Textarea (auto-grow) + Send button with `ClickSpark`

Personality modes change EDEN's tone:
- **Teacher**: Formal, step-by-step explanations, cite sources
- **Friend**: Casual, encouraging, emojis, slang-friendly
- **Mentor**: Wise, big-picture advice, Socratic questioning
- **Coach**: Intense, deadline-driven, accountability
- **Career**: Professional, ROI-focused, industry-aware

---

## Phase 2 — Enhanced Dashboards (Full Bento Grid Rebuild)

### 2.1 — Student Dashboard

#### [MODIFY] `frontend/src/pages/dashboard/StudentDashboard.tsx`

12-column Bento Grid layout:

```
[col-span-12] EDEN Welcome Hero
  → Aurora background
  → BlurText animated greeting: "Good evening, Alex! 🌙 You're on a 12-day streak."
  → Daily roadmap: 3 highlighted tasks for today
  → Mood check-in: 5 emoji options

[col-span-4] XP & Level Ring     [col-span-4] 7-Day Streak       [col-span-4] Placement Score
  → SVG animated arc ring           → GitHub calendar mini           → Animated dial 0-100%
  → CountUp on XP number            → CountUp on streak days         → EDEN prediction label
  → Level badge + next milestone    → Longest streak shown           → Target companies shown

[col-span-8] Performance Chart   [col-span-4] Upcoming Tasks
  → Recharts AreaChart              → Task list priority-tagged
  → 6-month grade trend             → Due date countdown
  → Gradient fill                   → Check done with ClickSpark

[col-span-4] Attendance Ring     [col-span-4] Course Progress     [col-span-4] Badge Showcase
  → 5 subject ring charts           → 5 enrolled course bars         → 6 earned badges
  → Critical: BorderGlow red        → % completion animated          → Rarity glow effects

[col-span-12] EDEN Recommendations (Marquee)
  → Course recommendation cards scrolling
  → "Why EDEN recommends this" tooltip

[col-span-6] Recent Activity     [col-span-6] Quick Actions
  → FadeIn timeline items           → 4 MagneticButton actions
  → Icon + time + description       → ClickSpark on each
```

---

### 2.2 — Faculty Dashboard (Full Rebuild)

#### [MODIFY] `frontend/src/pages/dashboard/FacultyDashboard.tsx`

Bento Grid featuring:
- Class enrollment numbers with CountUp
- Assignment submission status bar chart (submitted/pending/late breakdown)
- Weekly teaching schedule calendar widget
- Student performance distribution (radar chart)
- Top 5 performing students leaderboard
- EDEN Insights card: "3 students at risk in DSA — attendance <70%"
- Quick actions: Create Quiz | Grade Assignments | Schedule Class | Send Announcement
- React Bits: `BlurText` header, `CountUp` stats, `TiltCard` student spotlight cards, `FadeIn` on chart load

---

### 2.3 — Admin Dashboard (Full Rebuild)

#### [MODIFY] `frontend/src/pages/dashboard/AdminDashboard.tsx`

Enterprise Bento featuring:
- Platform health: total users, DAU, new registrations (today/week/month) — all CountUp
- Server status indicators (green/yellow/red animated dots)
- User role distribution donut chart
- Department performance comparison bar chart
- Security alerts feed with severity `BorderGlow` badges
- Top 5 recent audit log entries
- Storage usage meter (animated progress bar)
- EDEN Admin Narration: "Platform activity is 23% higher than last week. 2 suspicious login attempts detected from unknown IPs."
- React Bits: `Aurora` header, `BlurText`, `CountUp`, `Strands` background, `BorderGlow` on alerts

---

### 2.4 — Mentor Dashboard (Full Rebuild)

#### [MODIFY] `frontend/src/pages/dashboard/MentorDashboard.tsx`

Bento featuring:
- Upcoming sessions countdown cards
- Active mentees list with progress bars
- Session history calendar
- Average session rating ring chart
- EDEN Suggestions: "Priya needs guidance on her resume — she hasn't updated it in 3 weeks"
- Quick actions: Schedule Session | View Mentee Profile | Message Mentee

---

### 2.5 — 8 New Role Dashboards

#### [NEW] `frontend/src/pages/roles/RecruiterDashboard.tsx`
Job posting stats, application funnel chart, candidate pipeline, shortlisted profiles

#### [NEW] `frontend/src/pages/roles/ParentDashboard.tsx`
Child's attendance, grades, course progress, fee payment status, EDEN summary

#### [NEW] `frontend/src/pages/roles/PlacementOfficerDashboard.tsx`
Placement statistics, offer breakdown, company-wise stats, pending applications

#### [NEW] `frontend/src/pages/roles/HODDashboard.tsx`
Department performance analytics, faculty workload, course completion rates

#### [NEW] `frontend/src/pages/roles/ResearcherDashboard.tsx`
Publications tracker, citation count, ongoing projects, collaboration network

#### [NEW] `frontend/src/pages/roles/AlumniDashboard.tsx`
Mentorship given, referrals sent, network connections, company represented

#### [NEW] `frontend/src/pages/roles/IndustryDashboard.tsx`
Talent pool browser, skill match search, partnership projects, hiring pipeline

#### [NEW] `frontend/src/pages/roles/SuperAdminDashboard.tsx`
Full platform control: all data, all settings, all roles, system health, billing

Each uses React Bits: `BlurText`, `CountUp`, `TiltCard`, `FadeIn`, at minimum.

---

## Phase 3 — Academic Domain (6 New Pages)

### 3.1 — Course Library

#### [NEW] `frontend/src/pages/academic/CourseLibrary.tsx`

- Global search bar with live filtering
- Filters: Department chips, Level toggle (Beginner/Inter/Advanced), Duration slider, Rating filter
- Results grid: `TiltCard` course cards
  - Thumbnail, course title, instructor avatar + name, rating stars, duration, student count, tag chips
  - Progress bar overlay for enrolled courses
  - Enroll/Continue button (optimistic update + toast)
- Tabs: All | My Courses | Recommended | Trending
- EDEN recommendation strip at top
- Empty state with EDEN suggestion: "You haven't enrolled in anything yet. Try starting with React Basics →"
- React Bits: `TiltCard` cards, `BlurText` page title, `Particles` hero background, `FadeIn` on load, `ClickSpark` on enroll

---

### 3.2 — Attendance Tracker

#### [NEW] `frontend/src/pages/academic/AttendanceTracker.tsx`

- GitHub-style contribution heatmap (12 weeks × 7 days)
  - Green = attended, dark = missed, gray = no class
  - Hover tooltip: "Tuesday Mar 12 — Data Structures — Present"
- Subject-wise attendance ring charts (3-column grid)
  - Color logic: >85% green, 75-85% yellow, <75% red with `BorderGlow` pulse
- EDEN "worried" state visually triggered when any subject <75%
- EDEN guidance card (per critical subject): "Your Data Structures attendance is 71%. Attend the next 3 classes to recover above 75% by the 15th."
- Trend line chart: weekly attendance % over last 8 weeks
- Click any day on heatmap → popup showing: Subject, Time, Status (present/absent/late)
- React Bits: `BorderGlow` on critical cards, `CountUp` on percentages, `FadeIn` on heatmap reveal, `BlurText` on "Attendance" heading

---

### 3.3 — Assignment Hub

#### [NEW] `frontend/src/pages/academic/AssignmentHub.tsx`

- Kanban-style column layout: **To Do** | **In Progress** | **Submitted** | **Graded**
- Assignment cards: title, course badge, due date countdown, max marks, allowed file types
- Priority badges: URGENT (red pulse `BorderGlow`), HIGH (orange), MEDIUM (blue), LOW (gray)
- Click card → right-side detail panel slides in:
  - Full description with markdown rendering
  - EDEN Helper: "Let me break this into subtasks → 1. Research... 2. Draft... 3. Code..."
  - File upload drag-and-drop zone (mocked, shows file preview)
  - Text answer editor
  - "Submit Assignment" button with `ClickSpark` + confetti
- Plagiarism risk indicator bar (color-coded 0-100%)
- Filter: Course, Priority, Status, Due Date
- React Bits: `ClickSpark` on submit, `Bounce` on due-soon urgent cards, `Spotlight` on selected card, `FadeIn` on panel open

---

### 3.4 — Smart Notes (Full Enhancement)

#### [MODIFY] `frontend/src/pages/SmartNotes.tsx`

New capabilities on top of existing:
- AI toolbar strip with action buttons:
  - **Summarize** → EDEN generates 5-point bullet summary (Typewriter stream)
  - **Flashcards** → Flip-card deck appears below (CSS 3D perspective)
  - **Generate Quiz** → 5 MCQ questions from note content
  - **Mind Map** → Simple SVG node graph visualization
- Note version history dropdown (select any past version to restore)
- Tags input with autocomplete chip selector
- Share toggle → generates shareable link (copy to clipboard + toast)
- React Bits: `Typewriter` on AI summary output, `BlurText` on note title, `BorderGlow` on active note card, `ClickSpark` on save

---

### 3.5 — Timetable

#### [NEW] `frontend/src/pages/academic/Timetable.tsx`

- 5-day weekly grid (Mon–Fri), hour slots 8am–6pm
- Sessions displayed as colored blocks (unique color per subject)
- Click session → popup card: Subject, Faculty name, Room/Location, Duration, Zoom link (virtual)
- Day / Week toggle
- EDEN tip bar at top: "You have a free 2-hour block on Thursday — ideal time for DSA practice"
- "Today" highlight column with `Spotlight` glow
- React Bits: `FadeIn` on session blocks, `Spotlight` on today's column, `BlurText` on "Timetable" heading

---

### 3.6 — Exam Manager

#### [NEW] `frontend/src/pages/academic/ExamManager.tsx`

- Upcoming exams: countdown cards (days:hrs:mins) with subject, date, time, venue
- Past results table: subject, date, score, percentile, rank, grade
- EDEN auto-revision plan: generates daily study targets per subject based on time remaining
- Study time tracker: hours invested per subject (bar chart)
- React Bits: `CountUp` on scores, `BlurText` on "Upcoming Exams", `Bounce` on exam cards near deadline

---

## Phase 4 — Career Domain (5 Pages)

### 4.1 — Resume Builder

#### [NEW] `frontend/src/pages/career/ResumeBuilder.tsx`

**Split panel: Left editor | Right live preview**

Editor sections (accordion):
- Personal Info (name, headline, email, phone, LinkedIn, GitHub, location)
- Professional Summary (textarea + AI-generate button)
- Work Experience (add/edit/remove entries with timeline)
- Education (degree, institution, year, GPA)
- Skills (tag input + skill level indicator)
- Projects (title, description, tech stack, GitHub link)
- Certifications (name, issuer, date, credential link)

Live ATS Score meter (right panel bottom):
- 0-100 score updates on every keystroke
- Score breakdown: Keywords (25pts) | Formatting (20pts) | Experience (25pts) | Skills (20pts) | Education (10pts)
- EDEN improvement tips: "Adding 'Docker' and 'Kubernetes' could raise your score by ~12 points"
- Color: <60 red, 60-79 yellow, 80+ green with `BorderGlow`

Templates: Classic | Modern | Minimal | Bold (switch with instant re-render)
Export: browser print dialog

React Bits: `CountUp` on ATS score, `BorderGlow` on ATS meter when score improves, `BlurText` headers, `ClickSpark` on "Export PDF"

---

### 4.2 — Job Board

#### [NEW] `frontend/src/pages/career/JobBoard.tsx`

- Search + filters: Job Type | Location | Salary | Skills Required | Remote/Onsite
- Job cards (`TiltCard`): company logo, title, type badge, location, salary, deadline, EDEN match score
- EDEN match score: 0-100% based on profile skills vs job requirements
- Applied | Saved toggle buttons per card
- Click card → right drawer: full job description + requirements + apply button
- Tabs: All Jobs | Saved | Applied | EDEN Recommended
- Applied jobs: timeline tracker showing application stages
- React Bits: `TiltCard` on job cards, `Marquee` for "Hot Companies" strip, `FadeIn` on list, `ClickSpark` on Apply

---

### 4.3 — Mock Interview Arena

#### [NEW] `frontend/src/pages/career/MockInterview.tsx`

- Step 1: Select company (Google, Amazon, Microsoft, Meta, Infosys, TCS, Wipro, Goldman Sachs, McKinsey, Startup)
- Step 2: Select role and round type (HR | Technical | System Design | Behavioral)
- EDEN adopts interviewer persona: changes name, avatar color, greeting style, question style
- Interview session:
  - Question displayed with `SplitText` dramatic reveal
  - Answer textarea (auto-grow) with word count
  - Timer bar (optional time limit per question)
  - "Submit Answer" → EDEN scores 0-10 with feedback panel
- Session summary: total score, strong answers, weak answers, improvement tips
- React Bits: `SplitText` on question display, `Spotlight` on active question, `ClickSpark` on submit, `BlurText` on score reveal

---

### 4.4 — Placement Hub (Enhanced)

#### [MODIFY] PlacementHub in GeneralViews → dedicated page with:

- Animated placement probability dial (0-100% SVG arc)
- Company eligibility checker: paste job requirements → EDEN shows skill match vs gaps
- Placement stats with CountUp: offers, highest package, average package
- Skills gap radar chart: actual skills vs target role requirements
- EDEN career roadmap timeline
- Company shortlist: top 10 companies matching profile

---

### 4.5 — Career Universe

#### [NEW] `frontend/src/pages/career/CareerUniverse.tsx`

- SVG-based interactive skill node graph (pan + zoom via mouse/touch)
- Nodes: mastered skills (gold star), learning (blue pulse), target (dimmed)
- Edges: connect related skills with animated gradient lines
- Click node → info panel: description, learning resources, related jobs, ~hours to learn
- EDEN Life GPS bar: "At your pace, you'll qualify for Senior Dev roles in ~14 months"
- React Bits: `Particles` background, `BlurText` on "Your Career Universe", `BorderGlow` on selected nodes

---

## Phase 5 — Gamification Hub

#### [NEW] `frontend/src/pages/gamification/GamificationHub.tsx`

Page sections:

**Hero — XP & Level:**
- Large SVG animated arc ring for level progress
- `CountUp` on current XP and XP needed for next level
- Level badge with glow
- `SplitText` "LEVEL 5 ACHIEVED!" on milestone animation

**Daily Missions:**
- 5 mission items, each with XP reward chip
- Checkbox with `ClickSpark` animation on complete
- Progress bar showing today's mission completion

**Weekly Challenges:**
- 3 challenge cards with countdown timers

**Badge Wall:**
- Grid of all 30+ badges
- Earned badges glow by rarity: common(white) | rare(blue `BorderGlow`) | epic(purple) | legendary(gold shimmer)
- Locked badges shown as dark silhouettes with "?" lock icon

**Leaderboard:**
- Top 10 students: rank medal, avatar, name, XP bar, level, streak
- "Your Rank" highlighted with `Spotlight`

**EDEN Evolution Timeline:**
- Horizontal timeline: 7 stages with icons
- Current stage pulsing glow
- Completed stages gold, future stages gray
- Progress bar between current and next stage

**Achievement Museum:**
- Completed achievements grid with trophy icons, completion dates, XP rewards
- Trophy icon with `Bounce` on hover

**Streak Calendar:**
- GitHub-style 12-week heatmap

React Bits: `Aurora` header background, `CountUp` all numbers, `SplitText` "Level Up!", `Bounce` on earned badges, `ClickSpark` on mission completions

---

## Phase 6 — Collaboration Domain

### 6.1 — Team Workspace (Enhanced)

#### [MODIFY] `frontend/src/pages/TeamWorkspace.tsx`

Full enhancement:
- Left: Channel sidebar with channel categories (text/voice/announcement)
- Center: Full chat area with message bubbles, emoji reactions, reply threads, file previews
- Right: Members panel with real-time online/offline dots (Socket.IO)
- Tabs: Chat | Kanban | Files | GitHub
- Real Socket.IO integration (falls back to mock when backend unavailable)
- EDEN team suggestion: "3 tasks are overdue — consider a standup meeting today"

---

### 6.2 — Project Kanban

#### [NEW] `frontend/src/pages/collaboration/ProjectKanban.tsx`

- Columns: Backlog | To Do | In Progress | Review | Done
- Drag simulation (pointer events, CSS translate, state-driven)
- Task cards: title, assignee avatars, priority badge, label chips, due date, subtask ratio (2/5)
- Add task: inline form at bottom of each column
- Filters: Assignee, Priority, Label, Date
- EDEN risk detection: "Task 'API Integration' has been in-progress for 5 days — possible delay"
- React Bits: `FadeIn` on cards, `BorderGlow` on overdue tasks, `ClickSpark` on task complete

---

### 6.3 — Discussion Forum

#### [NEW] `frontend/src/pages/collaboration/DiscussionForum.tsx`

- Category tabs: Academic | Career | Tech | Campus | Off-Topic
- Post list: title, author avatar, vote score, answer count, views, tags, relative time
- Best Answer badge on accepted answers
- Create Post modal: title + rich text editor + tag selector
- Post detail view: full content + threaded answers + upvote/downvote
- EDEN duplicate detection: "A similar question was asked 3 months ago →" (link shown)
- React Bits: `BlurText` on post titles, `FadeIn` on answer list, `ClickSpark` on upvote

---

## Phase 7 — Campus Domain

### 7.1 — Hall of Fame

#### [NEW] `frontend/src/pages/campus/HallOfFame.tsx`

- Cinematic page with `Aurora` background
- Podium (1st/2nd/3rd) with confetti animation on page load
- Category tabs: Academic | Placement | Hackathon | Sports | Community
- Student spotlight cards: photo, name, achievement, badge collection, EDEN stage
- "Your Position" personal widget with rank and score
- React Bits: `Aurora` background, `SplitText` "Hall of Fame" heading, `Bounce` on podium positions, `Antigravity` floating elements

---

### 7.2 — Clubs & Communities

#### [NEW] `frontend/src/pages/campus/ClubsAndCommunities.tsx`

- Club discovery grid: name, member count, category badge, join button
- My Clubs section with latest activity
- Club detail drawer: about, upcoming events, member list, recent posts
- EDEN match: "Based on your Python + ML skills, you'd be a great fit for the AI Research Club"
- React Bits: `TiltCard` on club cards, `Particles` header, `FadeIn` on member list

---

### 7.3 — Events & Challenges (Enhanced)

Enhancements to existing `EventsChallenges`:
- `TiltCard` on all event cards
- Countdown timer (days:hrs:mins:secs) on featured event
- EDEN interest-match score badge per event
- React Bits: `CountUp` on registered count, `Marquee` for upcoming events

---

## Phase 8 — Admin Panel (Enterprise)

### 8.1 — User Management

#### [NEW] `frontend/src/pages/admin/UserManagement.tsx`

- Sortable data table: Avatar | Name | Email | Role badge | Department | Status dot | Last Active | Actions
- Row actions menu: View | Edit Role | Lock/Unlock | Send Email | Delete
- Bulk select (checkbox) + Bulk actions toolbar
- Search bar + filters: Role | Department | Status | Date range
- Pagination (20 per page) with page controls
- Export CSV button
- Edit Role modal: radio group of all 12 roles + confirm
- API wired to `GET /api/users` with query params
- React Bits: `FadeIn` on rows, `ClickSpark` on bulk actions, `BlurText` heading

---

### 8.2 — Department Manager

#### [NEW] `frontend/src/pages/admin/DepartmentManager.tsx`

- Department cards grid: name, HOD, faculty count, student count, performance score
- Expand card → Recharts LineChart of performance over 12 months
- HOD assignment: searchable user dropdown
- Add Department modal: name, code, description
- EDEN insight: "CS dept performance trending 8% down this semester"
- React Bits: `TiltCard` on dept cards, `CountUp` on counts, `BlurText` heading

---

### 8.3 — Audit Logs

#### [NEW] `frontend/src/pages/admin/AuditLogs.tsx`

- Timeline-style log list with severity color-coded left border
- Columns: Timestamp | Actor name+avatar | Action | Resource | IP | Severity badge
- Filters: Date range picker | Actor search | Severity | Action type
- Log detail modal: full record including changes diff (before/after JSON)
- EDEN summary panel: "In the last 24h: 3 role changes, 12 logins, 1 failed attempt"
- Export logs button (CSV)
- API wired to `GET /api/admin/audit-logs`
- React Bits: `FadeIn` on log entries, `BorderGlow` on critical/error severity rows

---

### 8.4 — Analytics Dashboard

#### [NEW] `frontend/src/pages/analytics/AdminAnalytics.tsx`

Full analytics Bento grid:
- User role distribution donut (Recharts PieChart)
- New registrations trend area chart (weekly)
- Course completion rates by department bar chart
- Top 10 most active students table
- Placement success rate line chart
- EDEN Activity usage heatmap
- Risk predictions list: "5 students flagged for dropout risk"
- All charts: gradient fills + custom tooltips + animated entry
- API wired to `GET /api/analytics/admin/overview`
- React Bits: `CountUp` all stats, `BlurText` section titles, `Strands` background, `FadeIn` charts

---

## Phase 9 — EDEN Domain Pages

### 9.1 — AI Copilot (Enhanced)

#### [MODIFY] `frontend/src/pages/AICopilot.tsx`

New interaction modes added:
- **Chat Mode**: General EDEN conversation (existing, enhanced)
- **Document Mode**: Upload PDF → EDEN answers questions about content
- **Study Planner**: Input subjects + exam dates → day-by-day plan output
- **Code Review**: Paste code → EDEN explains + spots bugs + suggests optimization
- **Career Coach**: Resume/JD input → ATS score + interview tips
- **Research Mode**: Topic → literature summary + research gaps
Mode switcher tabs with icon + label
React Bits: `Typewriter` on EDEN responses, `BlurText` mode names, `Spotlight` on active mode

---

### 9.2 — AI Research Assistant

#### [NEW] `frontend/src/pages/eden/AIResearchAssistant.tsx`

- PDF drag-and-drop upload zone with animated upload progress
- EDEN analysis output sections:
  - Abstract Summary (3 bullet points)
  - Key Findings (5 items)
  - Methodology Notes
  - Research Gaps identified
  - 5 Related Paper suggestions (mocked)
  - Citation generator: APA | MLA | IEEE format
- "Ask about this paper" chat input wired to EDEN
- React Bits: `BlurText` on section headers, `FadeIn` on extracted sections, `BorderGlow` on citation card, `ClickSpark` on copy citation

---

## Phase 10 — DevOps & Infrastructure

### 10.1 — Backend Dockerfile

#### [NEW] `backend/Dockerfile`
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 5000
CMD ["node", "dist/server.js"]
```

### 10.2 — Docker Compose

#### [NEW] `docker-compose.yml`
```yaml
version: '3.9'
services:
  backend:
    build: ./backend
    ports: ["5000:5000"]
    env_file: ./backend/.env
    depends_on: [mongo, redis]
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports: ["80:80"]
    restart: unless-stopped

  mongo:
    image: mongo:7
    volumes: [mongo_data:/data/db]
    ports: ["27017:27017"]
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    restart: unless-stopped

volumes:
  mongo_data:
```

### 10.3 — GitHub Actions CI/CD

#### [NEW] `.github/workflows/ci.yml`
```yaml
name: EduSphere CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run build

  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run build
```

---

## 🎨 React Bits Integration — Complete Matrix

Every page must include at minimum 3 React Bits components.

| Component | Required On |
|---|---|
| `BlurText` | Every page H1 heading |
| `SplitText` | Section titles, achievement reveals, interview questions |
| `Typewriter` | All EDEN responses, AI-generated content streaming |
| `Aurora` | Dashboard heroes, EDEN chat background, Hall of Fame |
| `Particles` | Career Universe, Clubs page, EDEN companion backdrop |
| `Spotlight` | Selected cards, active form fields, interview focus area |
| `TiltCard` | Course cards, Job cards, Club cards, Event cards, Department cards |
| `MagneticButton` | All primary CTA buttons (Enroll, Apply, Submit, Join) |
| `ClickSpark` | Form submissions, mission checkboxes, task completions, all buttons |
| `BorderGlow` | Critical attendance alerts, ATS score meter, EDEN chat border, urgent tasks |
| `CountUp` | XP, attendance %, packages, scores, user counts — ALL numeric stats |
| `Marquee` | Hot companies strip, recommendations, announcements ticker |
| `BentoGrid` | All dashboard layouts, analytics grids |
| `Bounce` | Notification badges, earned achievement icons, due-soon cards |
| `FadeIn` | Table rows, list items loading, modals, drawer panels |
| `Strands` | Admin analytics backgrounds, data-heavy pages |
| `Antigravity` | Login page floating elements, EDEN evolution celebration |
| `ScaleIn` | Modal appearances, notification pop-ins |

---

## 🔐 12-Role Auth System

Expanded `AuthContext` with all 12 roles and quick-login shortcuts on the login page:

| # | Role | Shortcut Key | Dashboard Route |
|---|---|---|---|
| 1 | `student` | S | StudentDashboard |
| 2 | `faculty` | F | FacultyDashboard |
| 3 | `mentor` | M | MentorDashboard |
| 4 | `admin` | A | AdminDashboard |
| 5 | `recruiter` | R | RecruiterDashboard |
| 6 | `parent` | P | ParentDashboard |
| 7 | `placement_officer` | O | PlacementOfficerDashboard |
| 8 | `hod` | H | HODDashboard |
| 9 | `researcher` | Re | ResearcherDashboard |
| 10 | `alumni` | Al | AlumniDashboard |
| 11 | `industry_partner` | I | IndustryDashboard |
| 12 | `super_admin` | SA | SuperAdminDashboard |

Login page: 12 quick-login shortcut cards with role name + icon + click-to-login.

---

## 🌐 Frontend API Service Layer

#### [NEW] `frontend/src/services/api.ts`
```typescript
// Axios instance with:
// - baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
// - request interceptor: attach JWT from Redux store
// - response interceptor: on 401 → try refresh token → retry
// - on refresh failure → dispatch logout action
```

#### [NEW] All service files:
- `auth.service.ts` — login, register, logout, me, refresh
- `users.service.ts` — CRUD + role management
- `courses.service.ts` — list, enroll, progress
- `assignments.service.ts` — list, submit, grade
- `notes.service.ts` — CRUD + ai-summary
- `quiz.service.ts` — list, attempt, results
- `jobs.service.ts` — list, apply, applications
- `eden.service.ts` — chat, insights, evolve
- `gamification.service.ts` — profile, leaderboard

---

## ✅ Verification Plan

### After Phase 0 (Backend)
```bash
cd backend && npm run dev
# Verify: GET http://localhost:5000/api/health returns 200
# Verify: POST /api/auth/register creates user in MongoDB
# Verify: POST /api/auth/login returns JWT
# Verify: GET /api/courses returns seeded course list
```

### After Phase 1 (EDEN Core)
```bash
cd frontend && npm run dev
# Verify: EDEN companion widget visible on dashboard
# Verify: Click EDEN → chat panel opens
# Verify: Send message → Typewriter response animation plays
# Verify: Stage emoji and color correct for mock user XP level
```

### After Phase 2 (Dashboards)
```bash
# Verify: Student dashboard Bento grid renders all 6 rows
# Verify: CountUp animations play on XP, streak, attendance numbers
# Verify: Aurora background visible on welcome hero card
# Verify: All 12 roles login and show correct dashboard
```

### Full Integration Verification Checklist
1. ☐ Login as Student → animated Bento dashboard + EDEN greeting
2. ☐ EDEN companion visible on every page, stage-appropriate avatar
3. ☐ Course Library → TiltCards rendered, enroll works with toast
4. ☐ Attendance → heatmap rendered, EDEN "worried" state at <75%
5. ☐ Resume Builder → ATS score live-updates as content typed
6. ☐ Mock Interview → EDEN adopts Google persona, scores answer
7. ☐ Gamification Hub → badge wall glow, evolution timeline, CountUp
8. ☐ Admin → UserManagement table 200+ rows sortable + filterable
9. ☐ Socket.IO → message in TeamWorkspace delivered in real-time
10. ☐ Theme toggle → dark/light transitions all CSS tokens correctly
11. ☐ All 12 role quick-login shortcuts work on login page
12. ☐ Docker compose up → all 4 containers start, app accessible

---

## 📅 Phased Execution Order

| Phase | Scope | New/Modified Files |
|---|---|---|
| **0** | Backend: init, models, auth, routes, socket, seed | ~40 files |
| **1** | EDEN AI Core: types, slice, context, companion, chat | ~6 files |
| **2** | All 4 dashboards rebuilt as Bento + 8 new role dashboards | ~12 files |
| **3** | Academic domain: 6 pages | ~6 files |
| **4** | Career domain: 5 pages | ~5 files |
| **5** | Gamification Hub | ~1 file |
| **6** | Collaboration: Kanban + Forum | ~2 files |
| **7** | Campus: Hall of Fame + Clubs | ~2 files |
| **8** | Admin: UserManagement + DepartmentManager + AuditLogs + Analytics | ~4 files |
| **9** | EDEN pages: Copilot enhance + Research Assistant | ~2 files |
| **10** | Frontend service layer + hooks + API wiring | ~12 files |
| **11** | DevOps: Dockerfile + Docker Compose + GitHub Actions | ~5 files |
| **12** | AppShell expansion: 12-role nav + EDEN widget integration | ~2 files |
| **TOTAL** | | **~99 files** |
