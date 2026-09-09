import dotenv from 'dotenv';
dotenv.config();
import dns from 'dns';
try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
}
catch { }
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { ToolRegistry } from '../ai/tools/ToolRegistry.js';
async function runToolAuthorizationTest() {
    console.log('════════════════════════════════════════════════════════════');
    console.log('🛡️ Starting EDEN Role-Based Tool Authorization Security Test...');
    console.log('════════════════════════════════════════════════════════════\n');
    await connectDB();
    try {
        const dummyStudentId = new mongoose.Types.ObjectId().toString();
        const dummyFacultyId = new mongoose.Types.ObjectId().toString();
        const dummyRecruiterId = new mongoose.Types.ObjectId().toString();
        const dummyParentId = new mongoose.Types.ObjectId().toString();
        // ── Test 1: Declaration Scoping for Student Role ──────────────────────
        console.log('1️⃣ Testing LLM Tool Declaration Scoping for Student Role...');
        const studentDeclarations = ToolRegistry.getDeclarations('student');
        const declNames = studentDeclarations.map(d => d.name);
        console.log(`   📋 Declarations visible to Student: ${JSON.stringify(declNames)}`);
        const containsFacultyTool = declNames.includes('get_at_risk_students');
        const containsRecruiterTool = declNames.includes('search_eligible_students');
        if (!containsFacultyTool && !containsRecruiterTool) {
            console.log('   ✅ DECLARATION SCOPING PASSED: Faculty and Recruiter tools strictly hidden from Student declaration list!\n');
        }
        else {
            console.error('   ❌ DECLARATION SCOPING FAILED: Privileged tools were exposed to Student LLM prompt!');
            process.exit(1);
        }
        // ── Test 2: Student Attempting to Call Faculty Tool (get_at_risk_students) ─
        console.log('2️⃣ Testing Direct Execution: Student calling Faculty tool (get_at_risk_students)...');
        const res1 = await ToolRegistry.executeTool('get_at_risk_students', {}, { userId: dummyStudentId, role: 'student', userName: 'Student A' });
        console.log(`   🔒 Result:`, res1);
        if (!res1.success && res1.error?.includes('not authorized')) {
            console.log('   ✅ RBAC SECURITY PASSED: Student blocked with explicit role authorization error!\n');
        }
        else {
            console.error('   ❌ RBAC SECURITY FAILED: Student was allowed to execute Faculty tool!');
            process.exit(1);
        }
        // ── Test 3: Faculty Calling Faculty Tool (get_at_risk_students) ───────
        console.log('3️⃣ Testing Direct Execution: Faculty calling Faculty tool (get_at_risk_students)...');
        const res2 = await ToolRegistry.executeTool('get_at_risk_students', {}, { userId: dummyFacultyId, role: 'faculty', userName: 'Dr. Smith', department: 'Computer Science' });
        console.log(`   🔓 Result: success=${res2.success}`);
        if (res2.success) {
            console.log('   ✅ AUTHORIZED ACCESS PASSED: Faculty successfully executed get_at_risk_students!\n');
        }
        else {
            console.error('   ❌ AUTHORIZED ACCESS FAILED: Faculty was blocked from legitimate tool!');
            process.exit(1);
        }
        // ── Test 4: Faculty Attempting to Call Recruiter Tool (search_eligible_students) ─
        console.log('4️⃣ Testing Direct Execution: Faculty calling Recruiter tool (search_eligible_students)...');
        const res3 = await ToolRegistry.executeTool('search_eligible_students', { minCGPA: 8.0 }, { userId: dummyFacultyId, role: 'faculty', userName: 'Dr. Smith' });
        console.log(`   🔒 Result:`, res3);
        if (!res3.success && res3.error?.includes('not authorized')) {
            console.log('   ✅ RBAC SECURITY PASSED: Faculty blocked from executing Recruiter tool!\n');
        }
        else {
            console.error('   ❌ RBAC SECURITY FAILED: Faculty executed Recruiter tool!');
            process.exit(1);
        }
        // ── Test 5: Recruiter Calling Recruiter Tool (search_eligible_students) ──
        console.log('5️⃣ Testing Direct Execution: Recruiter calling Recruiter tool (search_eligible_students)...');
        const res4 = await ToolRegistry.executeTool('search_eligible_students', { minCGPA: 8.0 }, { userId: dummyRecruiterId, role: 'recruiter', userName: 'Recruiter Jane' });
        console.log(`   🔓 Result: success=${res4.success}`);
        if (res4.success) {
            console.log('   ✅ AUTHORIZED ACCESS PASSED: Recruiter successfully executed search_eligible_students!\n');
        }
        else {
            console.error('   ❌ AUTHORIZED ACCESS FAILED: Recruiter was blocked from legitimate tool!');
            process.exit(1);
        }
        // ── Test 6: Parent Calling Parent Tool (get_linked_student_attendance) ──
        console.log('6️⃣ Testing Direct Execution: Parent calling Parent tool (get_linked_student_attendance)...');
        const res5 = await ToolRegistry.executeTool('get_linked_student_attendance', {}, { userId: dummyParentId, role: 'parent', userName: 'Parent Bob' });
        console.log(`   🔓 Result: success=${res5.success}, message=${res5.data?.message || 'Data retrieved'}`);
        if (res5.success) {
            console.log('   ✅ AUTHORIZED ACCESS PASSED: Parent successfully executed get_linked_student_attendance!\n');
        }
        else {
            console.error('   ❌ AUTHORIZED ACCESS FAILED: Parent was blocked from legitimate tool!');
            process.exit(1);
        }
        console.log('════════════════════════════════════════════════════════════');
        console.log('🎉 ALL ROLE-BASED TOOL AUTHORIZATION TESTS PASSED PERFECTLY!');
        console.log('════════════════════════════════════════════════════════════');
        process.exit(0);
    }
    catch (err) {
        console.error('❌ Tool authorization test execution failed:', err.message, err.stack);
        process.exit(1);
    }
}
runToolAuthorizationTest();
