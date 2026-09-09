import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { logger } from './config/logger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { setupSocketHandlers } from './socket/socketHandler.js';
import { initCronJobs } from './jobs/cronJobs.js';
import { eventNotificationService } from './services/EventNotificationService.js';
// Legacy routes (keeping for backward compat)
import compilerRoutes from './routes/compilerRoutes.js';
import authRoutesLegacy from './routes/authRoutes.js';
import mlRoutes from './routes/ml.routes.js';
import proctorRoutes from './routes/proctorRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import academicRoutes from './routes/academicRoutes.js';
import edenRoutes from './routes/edenRoutes.js';
// New v1 routes
import authRoutesV1 from './routes/v1/authRoutes.js';
import dashboardRoutes from './routes/v1/dashboardRoutes.js';
import courseRoutes from './routes/v1/courseRoutes.js';
import { assignmentRouter, jobRouter, eventRouter, forumRouter, gamificationRouter, adminRouter, notificationRouter, searchRouter, timetableRouter, placementRouter, roleDashboardRouter, kanbanRouter, analyticsRouter, hallOfFameRouter, interviewRouter } from './routes/v1/domainRoutes.js';
import { parentRouter, hodRouter, recruiterRouter, financeRouter, observabilityRouter, } from './routes/v1/enterpriseRoutes.js';
dotenv.config();
const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;
// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// HTTP request logging via Morgan → piped to Pino
app.use(morgan('combined', {
    stream: { write: (message) => logger.info({ msg: message.trim() }, '[HTTP]') },
}));
// ── Database & Cache ────────────────────────────────────────────────────────
connectDB();
connectRedis().catch(() => logger.warn('[Redis] Running without cache'));
// ── Socket.IO ──────────────────────────────────────────────────────────────
const io = new Server(httpServer, { cors: { origin: '*', methods: ['GET', 'POST'] } });
setupSocketHandlers(io);
// Make io available to controllers via app
app.set('io', io);
// ── Event Notification Pipeline ─────────────────────────────────────────────
// Subscribes to all event bus events and delivers notifications via Socket.IO + Email
eventNotificationService.init(io);
// ── Background Jobs ─────────────────────────────────────────────────────────
initCronJobs();
// ── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        system: 'EduSphere Enterprise Backend v2',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        services: {
            mongodb: 'connected',
            socketio: 'active',
            cronJobs: 'running',
        },
    });
});
// ── v1 API Routes ───────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutesV1);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/dashboard', roleDashboardRouter);
app.use('/api/v1/courses', courseRoutes);
import digitalTwinRoutes from './routes/v1/digitalTwinRoutes.js';
import mentorshipRoutes from './routes/v1/mentorshipRoutes.js';
import recallRoutes from './routes/v1/recallRoutes.js';
import collegeCourseRoutes from './routes/v1/collegeCourseRoutes.js';
import videoCourseRoutes from './routes/v1/videoCourseRoutes.js';
import profileRoutes from './routes/v1/profileRoutes.js';
app.use('/api/v1/assignments', assignmentRouter);
app.use('/api/v1/jobs', jobRouter);
app.use('/api/v1/events', eventRouter);
app.use('/api/v1/forum', forumRouter);
app.use('/api/v1/gamification', gamificationRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/digital-twin', digitalTwinRoutes);
app.use('/api/v1/mentorship', mentorshipRoutes);
app.use('/api/v1/recall', recallRoutes);
app.use('/api/v1/college-courses', collegeCourseRoutes);
app.use('/api/v1/learn', videoCourseRoutes);
app.use('/api/v1/timetable', timetableRouter);
app.use('/api/v1/placement', placementRouter);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/academic', academicRoutes);
app.use('/api/v1/kanban', kanbanRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/hall-of-fame', hallOfFameRouter);
app.use('/api/v1/career', interviewRouter);
app.use('/api/v1/profile', profileRoutes);
// ── Enterprise Routes (Phase 3+4) ────────────────────────────────────────────
app.use('/api/v1/parent', parentRouter);
app.use('/api/v1/hod', hodRouter);
app.use('/api/v1/recruiter', recruiterRouter);
app.use('/api/v1/finance', financeRouter);
app.use('/api/v1/observability', observabilityRouter);
app.use('/api/v1/ml', mlRoutes);
app.use('/api/v1/eden', edenRoutes);
// ── Legacy API Routes (backward compat) ────────────────────────────────────
app.use('/api/compiler', compilerRoutes);
app.use('/api/auth', authRoutesLegacy);
app.use('/api/ml', mlRoutes);
app.use('/api/proctor', proctorRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/eden', edenRoutes);
// Forward legacy paths to v1
app.use('/api/courses', courseRoutes);
app.use('/api/jobs', jobRouter);
app.use('/api/events', eventRouter);
app.use('/api/gamification', gamificationRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/search', searchRouter);
app.use('/api/assignments', assignmentRouter);
app.use('/api/forum', forumRouter);
// ── Error Handling ──────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);
// ── Start Server ────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
    logger.info(`
  ════════════════════════════════════════════════════════════
  🚀 EduSphere Enterprise Backend v2 Running
  🔗 HTTP API:       http://localhost:${PORT}/api/v1
  ⚡ Socket.IO:      ws://localhost:${PORT}
  📊 Dashboard:      GET /api/v1/dashboard (unified)
  🤖 EDEN AI:        /api/eden/chat (secured)
  🔍 Search:         GET /api/v1/search?q=...
  ⏰ Cron Jobs:      7 background jobs active
  ════════════════════════════════════════════════════════════
  `);
});
export { io };
