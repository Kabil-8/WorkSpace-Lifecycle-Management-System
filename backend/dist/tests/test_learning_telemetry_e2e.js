import dotenv from 'dotenv';
dotenv.config();
import dns from 'dns';
try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
}
catch { }
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import { LearningEvent } from '../models/LearningEvent.js';
import { LearningDNA } from '../ai/LearningDNA.js';
import { eventBus, Events } from '../events/eventBus.js';
import { eventNotificationService } from '../services/EventNotificationService.js';
import { ToolRegistry } from '../ai/tools/ToolRegistry.js';
async function runLearningTelemetryE2ETest() {
    console.log('════════════════════════════════════════════════════════════');
    console.log('🧪 Starting EduSphere Learning Telemetry & DNA End-to-End Test...');
    console.log('════════════════════════════════════════════════════════════\n');
    await connectDB();
    // Initialize notification service to ensure event bus listeners are registered
    const mockIo = { to: () => ({ emit: () => { } }) };
    eventNotificationService.init(mockIo);
    try {
        // ── Step 1: Setup Test Student ────────────────────────────────────────
        console.log('1️⃣ Setting up test student in MongoDB...');
        const student = await User.findOneAndUpdate({ email: 'dna_test_student@edusphere.ai' }, {
            name: 'Telemetry Student (E2E Test)',
            email: 'dna_test_student@edusphere.ai',
            passwordHash: 'dummyhash',
            role: 'student',
            department: 'Computer Science & Engineering',
            rollNumber: 'CS2026-DNA-01',
            isActive: true,
        }, { upsert: true, new: true });
        console.log(`   ✅ Test Student ID: ${student._id}\n`);
        // Clean prior learning events for clean slate
        await LearningEvent.deleteMany({ userId: student._id });
        // ── Step 2: Emit Diverse Learning Telemetry Events via EventBus ──────
        console.log('2️⃣ Emitting diverse learning telemetry events across 5 activities...');
        eventBus.emit(Events.VIDEO_STARTED, { userId: student._id.toString(), studentId: student._id, subject: 'Data Structures' });
        eventBus.emit(Events.VIDEO_COMPLETED, { userId: student._id.toString(), studentId: student._id, subject: 'Data Structures', duration: 1800 });
        eventBus.emit(Events.QUIZ_COMPLETED, { userId: student._id.toString(), studentId: student._id, subject: 'Data Structures', score: 90, totalMarks: 100 });
        eventBus.emit(Events.ASSIGNMENT_SUBMITTED, { userId: student._id.toString(), studentId: student._id, subject: 'Data Structures' });
        eventBus.emit(Events.CODE_EXECUTED, { userId: student._id.toString(), studentId: student._id, subject: 'python' });
        eventBus.emit(Events.RECALL_SESSION, { userId: student._id.toString(), studentId: student._id, subject: 'Data Structures', duration: 600 });
        // Wait 500ms for background MongoDB persistence listeners to execute
        await new Promise(r => setTimeout(r, 500));
        // ── Step 3: Verify Persistence in LearningEvent MongoDB Collection ───
        console.log('3️⃣ Verifying LearningEvent MongoDB persistence...');
        const savedEvents = await LearningEvent.find({ userId: student._id }).lean();
        console.log(`   📊 Total Learning Events persisted in MongoDB: ${savedEvents.length}`);
        const eventTypes = savedEvents.map(e => e.eventType);
        console.log(`   📋 Event Types recorded: ${JSON.stringify(eventTypes)}`);
        if (savedEvents.length >= 5) {
            console.log('   ✅ LEARNING EVENT PERSISTENCE PASSED!\n');
        }
        else {
            console.error(`   ❌ Persistence failed: expected at least 5 events, got ${savedEvents.length}`);
            process.exit(1);
        }
        // ── Step 4: Compute Learning DNA Profile ─────────────────────────────
        console.log('4️⃣ Computing Learning DNA Profile from real MongoDB telemetry...');
        const dnaProfile = await LearningDNA.compute(student._id.toString(), 30);
        console.log(`   🧬 Learning DNA Summary:`);
        console.log(`      • Total Events: ${dnaProfile.totalEvents}`);
        console.log(`      • Videos Started/Completed: ${dnaProfile.videosStarted}/${dnaProfile.videosCompleted} (${dnaProfile.videoCompletionRate}%)`);
        console.log(`      • Quiz Attempts & Avg Score: ${dnaProfile.quizAttempts} attempts, ${dnaProfile.quizAvgScore}% avg`);
        console.log(`      • Code Executions: ${dnaProfile.codeExecutions}`);
        console.log(`      • Total Study Minutes: ${dnaProfile.totalStudyMinutes} mins`);
        console.log(`      • Learning Velocity: ${dnaProfile.learningVelocity.toUpperCase()}\n`);
        if (dnaProfile.totalEvents >= 5 && dnaProfile.quizAvgScore === 90 && dnaProfile.codeExecutions >= 1) {
            console.log('   ✅ LEARNING DNA COMPUTATION PASSED!\n');
        }
        else {
            console.error('   ❌ Learning DNA profile metrics mismatch!');
            process.exit(1);
        }
        // ── Step 5: Test EDEN AI Tool Integration ──────────────────────────────
        console.log('5️⃣ Testing EDEN Tool Registry execution for Learning DNA...');
        const profileToolRes = await ToolRegistry.executeTool('get_my_profile', {}, { userId: student._id.toString(), role: 'student', userName: student.name, department: student.department });
        console.log(`   🛠️ get_my_profile Tool Output:\n${JSON.stringify(profileToolRes.data, null, 2)}`);
        if (profileToolRes.success && profileToolRes.data?.userName === student.name) {
            console.log('   ✅ EDEN Tool Integration PASSED!\n');
        }
        else {
            console.error('   ❌ EDEN Tool Integration failed!');
            process.exit(1);
        }
        // Cleanup test records
        await User.deleteOne({ _id: student._id });
        await LearningEvent.deleteMany({ userId: student._id });
        console.log('════════════════════════════════════════════════════════════');
        console.log('🎉 ALL LEARNING TELEMETRY & DNA END-TO-END TESTS PASSED PERFECTLY!');
        console.log('════════════════════════════════════════════════════════════');
        process.exit(0);
    }
    catch (err) {
        console.error('❌ E2E Test execution failed:', err.message, err.stack);
        process.exit(1);
    }
}
runLearningTelemetryE2ETest();
