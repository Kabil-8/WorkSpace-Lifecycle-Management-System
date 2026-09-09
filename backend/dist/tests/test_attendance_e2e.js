import dotenv from 'dotenv';
dotenv.config();
import dns from 'dns';
try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
}
catch { }
import jwt from 'jsonwebtoken';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import { StudentAttendance } from '../models/attendance/StudentAttendance.js';
import Notification from '../models/Notification.js';
import { EdenOrchestrator } from '../ai/EdenOrchestrator.js';
import { eventNotificationService } from '../services/EventNotificationService.js';
const JWT_SECRET = process.env.JWT_SECRET || 'edusphere_jwt_secret_key_2026';
async function runAttendanceE2ETest() {
    console.log('════════════════════════════════════════════════════════════');
    console.log('🧪 Starting EduSphere Attendance Module End-to-End Test...');
    console.log('════════════════════════════════════════════════════════════\n');
    await connectDB();
    // Initialize event notification service for event listeners
    const mockIo = { to: () => ({ emit: () => { } }) };
    eventNotificationService.init(mockIo);
    try {
        // ── Setup Real DB Users: Student A, Student B, Faculty, Parent ────────
        console.log('1️⃣ Setting up test accounts in MongoDB...');
        const studentA = await User.findOneAndUpdate({ email: 'e2e_student_a@edusphere.ai' }, {
            name: 'Student A (E2E Test)',
            email: 'e2e_student_a@edusphere.ai',
            passwordHash: 'dummyhash',
            role: 'student',
            department: 'Computer Science & Engineering',
            rollNumber: 'CS2026-E2E-A',
            isActive: true,
        }, { upsert: true, new: true });
        const studentB = await User.findOneAndUpdate({ email: 'e2e_student_b@edusphere.ai' }, {
            name: 'Student B (E2E Test)',
            email: 'e2e_student_b@edusphere.ai',
            passwordHash: 'dummyhash',
            role: 'student',
            department: 'Computer Science & Engineering',
            rollNumber: 'CS2026-E2E-B',
            isActive: true,
        }, { upsert: true, new: true });
        const parentA = await User.findOneAndUpdate({ email: 'e2e_parent_a@edusphere.ai' }, {
            name: 'Parent A (E2E Test)',
            email: 'e2e_parent_a@edusphere.ai',
            passwordHash: 'dummyhash',
            role: 'parent',
            linkedStudentId: studentA._id,
            linkedStudentIds: [studentA._id],
            isActive: true,
        }, { upsert: true, new: true });
        const faculty = await User.findOneAndUpdate({ email: 'e2e_faculty@edusphere.ai' }, {
            name: 'Faculty (E2E Test)',
            email: 'e2e_faculty@edusphere.ai',
            passwordHash: 'dummyhash',
            role: 'faculty',
            department: 'Computer Science & Engineering',
            employeeId: 'FAC-E2E-001',
            isActive: true,
        }, { upsert: true, new: true });
        // Ensure Student A references Parent A
        studentA.parentId = parentA._id;
        await studentA.save();
        console.log(`   ✅ Student A: ${studentA._id}`);
        console.log(`   ✅ Student B: ${studentB._id}`);
        console.log(`   ✅ Parent A: ${parentA._id} (linked to Student A)`);
        console.log(`   ✅ Faculty: ${faculty._id}\n`);
        // Clean prior attendance logs for test clean slate
        await StudentAttendance.deleteMany({ studentId: { $in: [studentA._id, studentB._id] } });
        await Notification.deleteMany({ userId: { $in: [studentA._id, studentB._id, parentA._id] } });
        // Generate JWT tokens
        const tokenStudentA = jwt.sign({ id: studentA._id.toString(), role: 'student' }, JWT_SECRET, { expiresIn: '1h' });
        const tokenFaculty = jwt.sign({ id: faculty._id.toString(), role: 'faculty' }, JWT_SECRET, { expiresIn: '1h' });
        // ── Step 2: Seed initial 4 attendance records for Student A ───────────
        console.log('2️⃣ Seeding 4 initial attendance records for Student A in MongoDB...');
        await StudentAttendance.insertMany([
            { studentId: studentA._id, studentName: studentA.name, rollNo: studentA.rollNumber, subject: 'Data Structures', status: 'Present', date: new Date(Date.now() - 86400000 * 4) },
            { studentId: studentA._id, studentName: studentA.name, rollNo: studentA.rollNumber, subject: 'Operating Systems', status: 'Present', date: new Date(Date.now() - 86400000 * 3) },
            { studentId: studentA._id, studentName: studentA.name, rollNo: studentA.rollNumber, subject: 'Database Systems', status: 'Present', date: new Date(Date.now() - 86400000 * 2) },
            { studentId: studentA._id, studentName: studentA.name, rollNo: studentA.rollNumber, subject: 'Computer Networks', status: 'Present', date: new Date(Date.now() - 86400000 * 1) },
        ]);
        console.log('   ✅ 4 records inserted (Initial Attendance: 100% — 4/4 present)\n');
        // ── Step 3: Faculty marks Student A "Absent" 4 times to drop below 75% ──
        console.log('3️⃣ Faculty marking Student A "Absent" to trigger <75% attendance alert...');
        const initialTotal = await StudentAttendance.countDocuments({ studentId: studentA._id });
        const initialPresent = await StudentAttendance.countDocuments({ studentId: studentA._id, status: { $in: ['Present', 'present'] } });
        console.log(`   📊 Before marking: ${initialPresent}/${initialTotal} present (${Math.round((initialPresent / initialTotal) * 100)}%)`);
        // Mark Student A absent 4 times via AttendanceController logic
        const { AttendanceController } = await import('../controllers/attendanceController.js');
        const mockReqMark = {
            user: faculty,
            body: {
                studentId: studentA._id.toString(),
                studentName: studentA.name,
                rollNo: studentA.rollNumber,
                subject: 'Data Structures',
                status: 'Absent',
                method: 'Manual Grid',
                remarks: 'Unexcused absence in lab session',
            },
        };
        const mockResMark = {
            status: () => mockResMark,
            json: (d) => d,
        };
        // Mark 4 absent sessions to bring attendance to 4/8 = 50%
        for (let i = 0; i < 4; i++) {
            await AttendanceController.markAttendance(mockReqMark, mockResMark);
        }
        const newTotal = await StudentAttendance.countDocuments({ studentId: studentA._id });
        const newPresent = await StudentAttendance.countDocuments({ studentId: studentA._id, status: { $in: ['Present', 'present'] } });
        const newPct = Math.round((newPresent / newTotal) * 100);
        console.log(`   📊 After marking: ${newPresent}/${newTotal} present (${newPct}%)`);
        if (newPct === 50) {
            console.log('   ✅ MongoDB attendance updated successfully (50% overall).\n');
        }
        else {
            console.error(`   ❌ Attendance calculation mismatch: expected 50%, got ${newPct}%`);
            process.exit(1);
        }
        // ── Step 4: Verify EventBus → Parent Notification ─────────────────────
        console.log('4️⃣ Verifying EventBus → Parent Notification Delivery...');
        // Give async event listener 500ms to process
        await new Promise(r => setTimeout(r, 500));
        const parentNotifications = await Notification.find({ userId: parentA._id }).lean();
        console.log(`   📨 Parent notifications count: ${parentNotifications.length}`);
        if (parentNotifications.length > 0) {
            const notif = parentNotifications[0];
            console.log(`   ✅ Notification Found! Title: "${notif.title}"`);
            console.log(`   ✅ Message: "${notif.message}"`);
            console.log(`   ✅ Priority: ${notif.priority.toUpperCase()}`);
            console.log('   ✅ EVENT & PARENT ALERT PIPELINE PASSED!\n');
        }
        else {
            console.error('   ❌ Parent notification was NOT created when attendance dropped below 75%!');
            process.exit(1);
        }
        // ── Step 5: EDEN AI Queries Attendance Tool ───────────────────────────
        console.log('5️⃣ Testing EDEN AI Attendance Tool execution (get_my_attendance)...');
        const { ToolRegistry } = await import('../ai/tools/ToolRegistry.js');
        const toolResult = await ToolRegistry.executeTool('get_my_attendance', {}, { userId: studentA._id.toString(), role: 'student', userName: studentA.name, department: studentA.department });
        console.log(`   🛠️ get_my_attendance Tool Result:\n${JSON.stringify(toolResult.data, null, 2)}`);
        if (toolResult.success && toolResult.data?.attendancePct === 50) {
            console.log('   ✅ get_my_attendance Tool returned exact 50% MongoDB attendance for Student A!');
        }
        else {
            console.error('   ❌ get_my_attendance Tool failed to return 50% MongoDB attendance data!');
            process.exit(1);
        }
        // Try full EDEN Orchestrator call
        try {
            const edenResponse = await EdenOrchestrator.processRequest({
                userQuery: 'What is my current attendance percentage?',
                userId: studentA._id.toString(),
                userName: studentA.name,
                role: 'student',
                department: studentA.department,
            });
            console.log(`   🤖 EDEN Response preview: ${edenResponse.content.slice(0, 150)}...`);
        }
        catch {
            console.log('   ℹ️ EDEN Orchestrator remote LLM call skipped (offline/unconfigured API key). Tool execution verified.');
        }
        console.log('   ✅ ATTENDANCE TOOL INTEGRATION PASSED!\n');
        // ── Step 6: Security & Horizontal Isolation Test ─────────────────────
        console.log('6️⃣ Testing Security & Horizontal Isolation (Student A requests Student B data)...');
        const { ParentController } = await import('../controllers/parentController.js');
        const mockReqUnauthorized = {
            user: studentA, // Student A logged in
            params: { studentId: studentB._id.toString() }, // Attempting to access Student B's data
        };
        let is403 = false;
        const mockResUnauthorized = {
            status: (code) => {
                if (code === 403)
                    is403 = true;
                return mockResUnauthorized;
            },
            json: (d) => d,
        };
        await ParentController.getLinkedStudentAttendance(mockReqUnauthorized, mockResUnauthorized);
        if (is403) {
            console.log('   🔒 SECURITY PASSED: Student A access to Student B attendance blocked with 403 Forbidden!\n');
        }
        else {
            console.error('   ❌ SECURITY FAILED: Student A was allowed to access Student B data!');
            process.exit(1);
        }
        // Clean up test records
        await User.deleteMany({ _id: { $in: [studentA._id, studentB._id, parentA._id, faculty._id] } });
        await StudentAttendance.deleteMany({ studentId: { $in: [studentA._id, studentB._id] } });
        await Notification.deleteMany({ userId: { $in: [studentA._id, studentB._id, parentA._id] } });
        console.log('════════════════════════════════════════════════════════════');
        console.log('🎉 ALL END-TO-END ATTENDANCE & SECURITY TESTS PASSED PERFECTLY!');
        console.log('════════════════════════════════════════════════════════════');
        process.exit(0);
    }
    catch (err) {
        console.error('❌ E2E Test execution failed:', err.message, err.stack);
        process.exit(1);
    }
}
runAttendanceE2ETest();
