import dotenv from 'dotenv';
dotenv.config();
import dns from 'dns';
try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
}
catch { }
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import { StudentAttendance } from '../models/attendance/StudentAttendance.js';
import { ToolRegistry } from '../ai/tools/ToolRegistry.js';
async function runHallucinationTest() {
    console.log('════════════════════════════════════════════════════════════');
    console.log('🧪 Starting EDEN Zero-Hallucination & Empty-Data Boundary Test...');
    console.log('════════════════════════════════════════════════════════════\n');
    await connectDB();
    try {
        // ── Step 1: Create Zero-Data Student Account ──────────────────────────
        console.log('1️⃣ Creating a fresh student user with 0 attendance/assignments...');
        const freshStudent = await User.findOneAndUpdate({ email: 'zero_data_student@edusphere.ai' }, {
            name: 'Zero Data Student (Hallucination Test)',
            email: 'zero_data_student@edusphere.ai',
            passwordHash: 'dummyhash',
            role: 'student',
            department: 'Data Science & AI',
            rollNumber: 'DSAI2026-ZERO',
            isActive: true,
        }, { upsert: true, new: true });
        // Ensure zero records exist in MongoDB for this test student
        await StudentAttendance.deleteMany({ studentId: freshStudent._id });
        console.log(`   ✅ Zero-Data Student Created ID: ${freshStudent._id}\n`);
        // ── Step 2: Test get_my_attendance with zero data ─────────────────────
        console.log('2️⃣ Executing get_my_attendance for student with 0 records in MongoDB...');
        const attResult = await ToolRegistry.executeTool('get_my_attendance', {}, { userId: freshStudent._id.toString(), role: 'student', userName: freshStudent.name, department: freshStudent.department });
        console.log(`   📊 get_my_attendance Tool Output:`, attResult.data);
        if (attResult.success && attResult.data?.hasData === false && attResult.data?.status === 'INSUFFICIENT_DATA') {
            console.log('   ✅ ZERO HALLUCINATION PASSED: Tool strictly returned hasData: false (no fake numbers!)\n');
        }
        else {
            console.error('   ❌ ZERO HALLUCINATION FAILED: Tool returned synthetic or fabricated attendance data!');
            process.exit(1);
        }
        // ── Step 3: Test get_my_profile for student without CGPA ──────────────
        console.log('3️⃣ Executing get_my_profile for student with unassigned CGPA...');
        const profileResult = await ToolRegistry.executeTool('get_my_profile', {}, { userId: freshStudent._id.toString(), role: 'student', userName: freshStudent.name, department: freshStudent.department });
        console.log(`   📊 get_my_profile Tool Output:`, profileResult.data);
        if (profileResult.success && profileResult.data?.cgpa === null) {
            console.log('   ✅ ZERO HALLUCINATION PASSED: CGPA strictly returned null (no fabricated GPA!)\n');
        }
        else {
            console.error('   ❌ ZERO HALLUCINATION FAILED: Profile tool fabricated a CGPA when none existed!');
            process.exit(1);
        }
        // ── Step 4: Test get_pending_submissions for faculty with 0 assignments ──
        console.log('4️⃣ Executing get_pending_submissions for faculty with 0 assignments...');
        const pendingResult = await ToolRegistry.executeTool('get_pending_submissions', {}, { userId: new mongoose.Types.ObjectId().toString(), role: 'faculty', userName: 'Dr. Test', department: 'Data Science & AI' });
        console.log(`   📊 get_pending_submissions Tool Output:`, pendingResult.data);
        if (pendingResult.success && pendingResult.data?.hasData === false) {
            console.log('   ✅ ZERO HALLUCINATION PASSED: Pending submissions tool returned hasData: false!\n');
        }
        else {
            console.error('   ❌ ZERO HALLUCINATION FAILED: Pending submissions tool returned fake assignments!');
            process.exit(1);
        }
        // Cleanup test user
        await User.deleteOne({ _id: freshStudent._id });
        console.log('════════════════════════════════════════════════════════════');
        console.log('🎉 ALL ZERO-HALLUCINATION & BOUNDARY TESTS PASSED PERFECTLY!');
        console.log('════════════════════════════════════════════════════════════');
        process.exit(0);
    }
    catch (err) {
        console.error('❌ Hallucination test execution failed:', err.message, err.stack);
        process.exit(1);
    }
}
runHallucinationTest();
