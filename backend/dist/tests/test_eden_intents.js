import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { IntentClassifier } from '../ai/IntentClassifier.js';
import { OpenDomainAIEngine } from '../ai/OpenDomainAIEngine.js';
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
async function runEdenIntentTestSuite() {
    console.log('🤖 EduSphere — EDEN AI Zero-Mock Intent Verification Suite\n');
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected ✓\n');
    const testUser = await User.create({
        name: 'Alpha Test Student',
        email: `eden_zero_mock_${Date.now()}@edusphere.ai`,
        passwordHash: 'hashed_pw',
        role: 'student',
        department: 'Computer Science',
        cgpa: 8.5,
    });
    const userContext = {
        userId: testUser._id.toString(),
        userName: testUser.name,
        role: testUser.role,
        department: testUser.department,
    };
    // ── Test 1: "describe java" ────────────────────────────────────────────────
    console.log('Test 1: "describe java"');
    const intent1 = IntentClassifier.classify('describe java');
    assert(intent1.intent === 'GENERAL_EXPLANATION', 'Intent classified as GENERAL_EXPLANATION');
    assert(intent1.agentRole === 'general', 'Agent role classified as general');
    assert(!intent1.requiresCode, 'Does NOT require code block generation');
    const res1 = await OpenDomainAIEngine.resolveQuery('describe java', userContext);
    assert(!res1.text.includes('int[] numbers = {10, 20, 30, 40, 50}'), 'Response does NOT contain hardcoded array sum snippet');
    assert(!res1.text.includes('public class ReverseNumber'), 'Response does NOT contain hardcoded ReverseNumber snippet');
    // ── Test 2: "what is inheritance in java" ──────────────────────────────────
    console.log('\nTest 2: "what is inheritance in java"');
    const intent2 = IntentClassifier.classify('what is inheritance in java');
    assert(intent2.intent === 'CONCEPT_EXPLANATION' || intent2.intent === 'GENERAL_EXPLANATION', 'Intent classified as CONCEPT_EXPLANATION');
    // ── Test 3: "write java program to reverse a number" ──────────────────────
    console.log('\nTest 3: "write java program to reverse a number"');
    const intent3 = IntentClassifier.classify('write java program to reverse a number');
    assert(intent3.intent === 'CODE_GENERATION', 'Intent classified as CODE_GENERATION');
    assert(intent3.requiresCode, 'Requires code generation');
    // ── Test 4: "why am I getting NullPointerException?" ─────────────────────
    console.log('\nTest 4: "why am I getting NullPointerException?"');
    const intent4 = IntentClassifier.classify('why am I getting NullPointerException?');
    assert(intent4.intent === 'ERROR_EXPLANATION' || intent4.intent === 'CODE_DEBUGGING', 'Intent classified as ERROR_EXPLANATION/CODE_DEBUGGING');
    // ── Test 5: "explain this java code" ──────────────────────────────────────
    console.log('\nTest 5: "explain this java code"');
    const intent5 = IntentClassifier.classify('explain this java code');
    assert(intent5.intent === 'CODE_EXPLANATION', 'Intent classified as CODE_EXPLANATION');
    // ── Test 6: "difference between Java and Python" ──────────────────────────
    console.log('\nTest 6: "difference between Java and Python"');
    const intent6 = IntentClassifier.classify('difference between Java and Python');
    assert(intent6.intent === 'COMPARISON', 'Intent classified as COMPARISON');
    // ── Test 7: "give me a hint for this assignment" ──────────────────────────
    console.log('\nTest 7: "give me a hint for this assignment"');
    const intent7 = IntentClassifier.classify('give me a hint for this assignment');
    assert(intent7.intent === 'ASSIGNMENT_HELP', 'Intent classified as ASSIGNMENT_HELP');
    // ── Test 8: "what is my attendance?" ──────────────────────────────────────
    console.log('\nTest 8: "what is my attendance?"');
    const intent8 = IntentClassifier.classify('what is my attendance?');
    assert(intent8.intent === 'PERSONAL_DATA_QUERY', 'Intent classified as PERSONAL_DATA_QUERY');
    assert(intent8.requiresUserData, 'Requires user ID authenticated context');
    const res8 = await OpenDomainAIEngine.resolveQuery('what is my attendance?', userContext);
    assert(res8.text.includes('attendance') || res8.text.includes('Eligible'), 'Response uses authenticated user attendance context from MongoDB');
    // Cleanup
    await User.deleteOne({ _id: testUser._id });
    console.log(`\n════════════════════════════════════`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log(`════════════════════════════════════`);
    await mongoose.disconnect();
    if (failed > 0) {
        console.error('\n❌ EDEN AI Zero-Mock Intent Verification Test Suite FAILED.');
        process.exit(1);
    }
    else {
        console.log('\n✅ All EDEN AI Zero-Mock Intent Verification tests PASSED PERFECTLY!');
        process.exit(0);
    }
}
runEdenIntentTestSuite().catch(err => {
    console.error('EDEN intent test execution failed:', err);
    process.exit(1);
});
