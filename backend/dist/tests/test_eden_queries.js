import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { GeminiService } from '../ai/GeminiService.js';
dotenv.config();
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edusphere';
let passed = 0;
let failed = 0;
function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ ${message}`);
        passed++;
    }
    else {
        console.error(`  ❌ FAIL: ${message}`);
        failed++;
    }
}
async function runEdenQueryTests() {
    console.log('🤖 EduSphere — EDEN AI Intelligent Query Resolution Verification Suite\n');
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected ✓\n');
    const testUser = await User.create({
        name: 'Alpha Test Student',
        email: `eden_test_${Date.now()}@edusphere.ai`,
        passwordHash: 'hashed_pw',
        role: 'student',
        department: 'Computer Science',
        cgpa: 8.4,
        xp: 250,
    });
    const userContext = {
        userId: testUser._id.toString(),
        userName: testUser.name,
        role: testUser.role,
        department: testUser.department,
        cgpa: testUser.cgpa,
    };
    // Test 1: Learning Pace / Digital Twin Query
    const r1 = await GeminiService.getFallbackResult('i need to know mt leaning pace', userContext);
    assert(!r1.text.includes("I've analyzed your query regarding"), 'EDEN does NOT return generic canned response for learning pace query');
    assert(r1.text.includes('Learning Pace') || r1.text.includes('Digital Twin'), 'EDEN returns Learning Pace / Digital Twin response');
    // Test 2: Attendance Query
    const r2 = await GeminiService.getFallbackResult('what is my attendance percentage?', userContext);
    assert(r2.text.includes('attendance') || r2.text.includes('Attendance'), 'EDEN answers attendance query');
    // Test 3: Assignment Query
    const r3 = await GeminiService.getFallbackResult('show my pending assignments', userContext);
    assert(r3.text.includes('Assignment') || r3.text.includes('Pending'), 'EDEN answers assignment query');
    // Test 4: Recall / Revision Query
    const r4 = await GeminiService.getFallbackResult('what active recall topics are due today?', userContext);
    assert(r4.text.includes('review') || r4.text.includes('Recall') || r4.text.includes('topic'), 'EDEN answers recall query');
    // Cleanup
    await User.deleteOne({ _id: testUser._id });
    console.log(`\n════════════════════════════════════`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log(`════════════════════════════════════`);
    await mongoose.disconnect();
    if (failed > 0) {
        console.error('\n❌ EDEN AI query resolution test FAILED.');
        process.exit(1);
    }
    else {
        console.log('\n✅ All EDEN AI Intelligent Query Resolution tests PASSED!');
        process.exit(0);
    }
}
runEdenQueryTests().catch(err => {
    console.error('EDEN query test execution failed:', err);
    process.exit(1);
});
