import { CompilerEngine } from '../services/compilerEngine.js';
import Notification from '../models/Notification.js';
import { GeminiService } from '../ai/GeminiService.js';
import { DigitalTwinEngine } from '../ai/DigitalTwinEngine.js';
let globalIO = null;
export const getIO = () => globalIO;
export const setupSocketHandlers = (io) => {
    globalIO = io;
    io.on('connection', (socket) => {
        console.log(`[Socket.IO] Client connected: ${socket.id}`);
        // ── Per-User Notification Socket Room ──────────────────────────────
        socket.on('user:join', (userId) => {
            if (userId) {
                socket.join(`user:${userId}`);
                socket.join(userId);
                console.log(`[Socket.IO] User socket ${socket.id} joined personal rooms user:${userId} and ${userId}`);
            }
        });
        // ── Real-Time Digital Twin Sync ─────────────────────────────────────
        socket.on('digital_twin:request_update', async (userId) => {
            try {
                if (!userId)
                    return;
                const twin = await DigitalTwinEngine.getOrComputeTwin(userId);
                io.to(`user:${userId}`).emit('digital_twin_updated', twin);
                io.to(userId).emit('digital_twin_updated', twin);
            }
            catch (err) {
                console.error('[Digital Twin Socket Error]', err);
            }
        });
        // ── Real-Time Per-User Notifications ───────────────────────────────
        socket.on('notification:push', async (payload) => {
            try {
                if (payload.userId && payload.userId !== 'all') {
                    // Persist per-user notification in MongoDB
                    const notif = await Notification.create({
                        userId: payload.userId,
                        title: payload.title,
                        message: payload.message,
                        type: payload.type || 'general',
                        priority: payload.priority || 'medium',
                        actionUrl: payload.actionUrl,
                        icon: payload.icon,
                    });
                    io.to(`user:${payload.userId}`).emit('notification:push', notif);
                    io.to(payload.userId).emit('notification:push', notif);
                }
                else {
                    io.emit('notification:push', payload);
                }
            }
            catch (err) {
                console.error('[Notification Socket Error]', err);
            }
        });
        // ── Code Compiler WebSockets ──────────────────────────────────────────
        socket.on('compile:run', async (payload) => {
            const executionId = payload.executionId || `exec_${Date.now()}`;
            socket.emit('compile:status', { executionId, status: 'running', message: 'Compilation & Execution started...' });
            const result = await CompilerEngine.execute({
                language: payload.language,
                code: payload.code,
                input: payload.input,
                timeoutMs: payload.timeoutMs || 5000,
            }, chunk => {
                socket.emit('compile:chunk', { executionId, ...chunk });
            });
            socket.emit('compile:result', { executionId, ...result });
        });
        // ── Real-Time Workspace Chat ──────────────────────────────────────────
        socket.on('chat:join', (channelId) => {
            socket.join(channelId);
            console.log(`[Socket.IO] Socket ${socket.id} joined channel ${channelId}`);
        });
        socket.on('chat:leave', (channelId) => {
            socket.leave(channelId);
        });
        socket.on('chat:message', (data) => {
            const msg = {
                id: `msg-${Date.now()}`,
                channelId: data.channelId,
                sender: data.sender,
                content: data.content,
                createdAt: new Date().toISOString(),
            };
            io.to(data.channelId).emit('chat:message', msg);
        });
        // ── Real-Time EDEN AI Streaming ───────────────────────────────────────
        socket.on('ai:prompt', async (data) => {
            try {
                const sysPrompt = `You are EDEN AI Copilot for EduSphere in ${data.mode || 'chat'} mode. Answer concisely and accurately based on academic data.`;
                for await (const event of GeminiService.streamChat(sysPrompt, data.prompt, [], 'student')) {
                    if (event.type === 'chunk') {
                        socket.emit('ai:stream', { text: event.data, isFinal: false });
                    }
                    else if (event.type === 'done') {
                        socket.emit('ai:stream', { text: '', isFinal: true });
                    }
                }
            }
            catch (err) {
                socket.emit('ai:stream', { text: `[EDEN AI Error: ${err.message}]`, isFinal: true });
            }
        });
        // ── Quiz Hub Real-Time Events ──────────────────────────────────────────
        socket.on('quiz:create', (quizData) => {
            console.log(`[Quiz Socket] New quiz created: ${quizData.title || quizData.id}`);
            io.emit('quiz:created', quizData);
        });
        socket.on('quiz:update', (quizData) => {
            console.log(`[Quiz Socket] Quiz updated: ${quizData.id}`);
            io.emit('quiz:updated', quizData);
        });
        socket.on('quiz:delete', (quizId) => {
            console.log(`[Quiz Socket] Quiz deleted: ${quizId}`);
            io.emit('quiz:deleted', quizId);
        });
        socket.on('quiz:submit', (attemptData) => {
            console.log(`[Quiz Socket] Quiz submitted by student: ${attemptData.studentName || attemptData.quizId}`);
            io.emit('quiz:submitted', attemptData);
        });
        // ── Manage Exams Real-Time Events ─────────────────────────────────────
        socket.on('exam:create', (examData) => {
            console.log(`[Exam Socket] New proctored exam created: ${examData.title || examData._id}`);
            io.emit('exam:created', examData);
        });
        socket.on('exam:update', (examData) => {
            console.log(`[Exam Socket] Proctored exam updated: ${examData._id}`);
            io.emit('exam:updated', examData);
        });
        socket.on('exam:delete', (examId) => {
            console.log(`[Exam Socket] Proctored exam deleted: ${examId}`);
            io.emit('exam:deleted', examId);
        });
        // ── EduShield AI Proctored Assessment WebSockets ─────────────────────
        socket.on('student-joined', (payload) => {
            const room = `proctor:${payload.examId}`;
            socket.join(room);
            console.log(`[Proctor Socket] Student ${payload.studentName} joined proctor room ${room}`);
            io.to(room).emit('camera-status', { studentId: payload.studentId, studentName: payload.studentName, status: 'active' });
            io.emit('proctor:student-online', payload);
        });
        socket.on('proctor:telemetry', (payload) => {
            const room = `proctor:${payload.examId}`;
            io.to(room).emit('risk-score-update', payload);
            io.emit('proctor:global-telemetry', payload);
        });
        socket.on('student-warning', async (payload) => {
            const room = `proctor:${payload.examId}`;
            io.to(room).emit('faculty-alert', payload);
            io.emit('proctor:global-alert', payload);
            // Send per-user targeted warning notification
            if (payload.studentId && payload.studentId !== 'fac-monitor-1') {
                try {
                    const notif = await Notification.create({
                        userId: payload.studentId,
                        title: `Proctor Warning (${payload.warningType || 'Integrity Flag'})`,
                        message: payload.message || `Warning #${payload.warningNumber}: Please maintain focus on your assessment screen.`,
                        type: 'exam',
                        priority: 'urgent',
                    });
                    io.to(`user:${payload.studentId}`).emit('notification:push', notif);
                }
                catch (e) {
                    console.warn('[Proctor Notification Failed]', e);
                }
            }
        });
        socket.on('faculty:action', async (payload) => {
            const room = `proctor:${payload.examId}`;
            console.log(`[Faculty Action] Action ${payload.action} sent for student ${payload.studentId}`);
            io.to(room).emit('student:remote-action', payload);
            io.emit('student:remote-action', payload);
            // Send targeted notification to the specific student
            if (payload.studentId && payload.studentId !== 'fac-monitor-1') {
                try {
                    const notif = await Notification.create({
                        userId: payload.studentId,
                        title: `Faculty Proctor Action: ${payload.action.toUpperCase()}`,
                        message: payload.customMessage || `Faculty has issued a ${payload.action} command on your active exam session.`,
                        type: 'exam',
                        priority: 'urgent',
                    });
                    io.to(`user:${payload.studentId}`).emit('notification:push', notif);
                }
                catch (e) {
                    console.warn('[Faculty Action Notification Failed]', e);
                }
            }
        });
        socket.on('analytics:request-update', (data) => {
            io.emit('analytics:updated', data || { timestamp: new Date().toISOString() });
        });
        socket.on('disconnect', () => {
            console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
        });
    });
};
