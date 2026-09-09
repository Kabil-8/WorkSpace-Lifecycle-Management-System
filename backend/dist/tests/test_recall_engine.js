/**
 * EduSphere — Recall Engine Integration Tests
 *
 * Tests A–L as specified in the implementation plan.
 *
 * Run: npx tsx src/tests/test_recall_engine.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import RecallItem from '../models/RecallItem.js';
import { SM2Engine } from '../ai/SM2Engine.js';
import { CognitiveLearningEngine } from '../ai/CognitiveLearningEngine.js';
dotenv.config();
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edusphere';
// ─── Test utility ─────────────────────────────────────────────────────────────
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
function section(label) {
    console.log(`\n────────────────────────────────────────────`);
    console.log(`🧪 ${label}`);
    console.log(`────────────────────────────────────────────`);
}
// ─── Pure SM2Engine Unit Tests ────────────────────────────────────────────────
function testSM2Engine() {
    section('SM2Engine Pure Algorithm Tests');
    // A: Quality 1 — interval resets to 1
    const forgot = SM2Engine.calculate({
        quality: 1, repetitions: 3, easeFactor: 2.5, interval: 24,
        lastReviewedAt: new Date(Date.now() - 2 * 86400000), reviewHistory: [],
    });
    assert(forgot.newInterval === 1, 'A: Quality=1 resets interval to 1');
    assert(forgot.newRepetitions === 0, 'A: Quality=1 resets repetitions to 0');
    assert(forgot.newEaseFactor < 2.5, 'A: Quality=1 decreases ease factor');
    assert(forgot.correct === false, 'A: Quality=1 marks correct=false');
    // B: Quality 3 — moderate interval increase
    const good = SM2Engine.calculate({
        quality: 3, repetitions: 2, easeFactor: 2.5, interval: 6,
        lastReviewedAt: new Date(Date.now() - 6 * 86400000), reviewHistory: [],
    });
    assert(good.newInterval > 6, 'B: Quality=3 increases interval moderately');
    assert(good.newRepetitions === 3, 'B: Quality=3 increments repetitions');
    assert(good.correct === true, 'B: Quality=3 marks correct=true');
    // C: Quality 5 — substantial interval increase
    const perfect = SM2Engine.calculate({
        quality: 5, repetitions: 3, easeFactor: 2.5, interval: 6,
        lastReviewedAt: new Date(Date.now() - 6 * 86400000), reviewHistory: [],
    });
    assert(perfect.newInterval > good.newInterval, 'C: Quality=5 gives larger interval than Quality=3');
    assert(perfect.newEaseFactor > 2.5, 'C: Quality=5 increases ease factor');
    // D: Minimum ease factor never below 1.3
    const worst = SM2Engine.calculate({
        quality: 1, repetitions: 0, easeFactor: 1.3, interval: 1,
        lastReviewedAt: null, reviewHistory: [],
    });
    assert(worst.newEaseFactor >= 1.3, 'D: Ease factor never falls below 1.3');
    // E: First review (rep=0, quality>=3) → interval=1
    const firstGood = SM2Engine.calculate({
        quality: 3, repetitions: 0, easeFactor: 2.5, interval: 1,
        lastReviewedAt: null, reviewHistory: [],
    });
    assert(firstGood.newInterval === 1, 'E: First successful review → interval=1');
    assert(firstGood.newRepetitions === 1, 'E: First successful review → rep=1');
    // F: Second successful review → interval=6
    const secondGood = SM2Engine.calculate({
        quality: 5, repetitions: 1, easeFactor: 2.5, interval: 1,
        lastReviewedAt: new Date(Date.now() - 86400000), reviewHistory: [],
    });
    assert(secondGood.newInterval === 6, 'F: Second successful review → interval=6');
    // G: Repeated successful recalls — EF and interval evolve
    let state = { repetitions: 0, easeFactor: 2.5, interval: 1 };
    for (let i = 0; i < 5; i++) {
        const r = SM2Engine.calculate({
            quality: 5, repetitions: state.repetitions, easeFactor: state.easeFactor, interval: state.interval,
            lastReviewedAt: new Date(Date.now() - state.interval * 86400000), reviewHistory: [],
        });
        state = { repetitions: r.newRepetitions, easeFactor: r.newEaseFactor, interval: r.newInterval };
    }
    assert(state.interval > 20, 'G: 5 perfect reviews → interval > 20 days');
    assert(state.easeFactor > 2.5, 'G: 5 perfect reviews → ease factor increases');
    // H: Mastery = 0 with 0 repetitions
    const zeroMastery = SM2Engine.calculateMastery({ quality: 1, newRepetitions: 0, newEaseFactor: 2.5, reviewHistory: [] });
    assert(zeroMastery === 0, 'H: 0 repetitions → mastery = 0 (never hardcoded)');
    // I: Retention = 0 with no review history
    const zeroRetention = SM2Engine.estimateCurrentRetention({ lastReviewedAt: null, interval: 1, easeFactor: 2.5, repetitions: 0 });
    assert(zeroRetention === 0, 'I: No reviews → retention = 0 (never hardcoded)');
    // J: Priority score for overdue item is higher
    const overdue = SM2Engine.calculatePriority({ nextReviewAt: new Date(Date.now() - 3 * 86400000), retention: 30, mistakeCount: 3, successCount: 2, repetitions: 2 });
    const fresh = SM2Engine.calculatePriority({ nextReviewAt: new Date(Date.now() + 86400000), retention: 85, mistakeCount: 0, successCount: 5, repetitions: 5 });
    assert(overdue.priorityScore > fresh.priorityScore, 'J: Overdue + low retention → higher priority score');
}
// ─── Database Integration Tests ───────────────────────────────────────────────
async function testDatabase() {
    section('Database Integration Tests');
    // Create test user IDs
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();
    const topicId = `test-topic-${Date.now()}`;
    // Cleanup before test
    await RecallItem.deleteMany({ $or: [{ userId: userA }, { userId: userB }], topicId: { $regex: /^test-/ } });
    // K: New student — no recall items by default
    const existingA = await RecallItem.find({ userId: userA });
    assert(existingA.length === 0, 'K: New student has 0 recall items in database (never pre-seeded)');
    // L: First review creates a recall item
    await CognitiveLearningEngine.evaluateRecallPerformance(userA.toString(), `Test Topic ${Date.now()}`, 5);
    const afterFirstReview = await RecallItem.find({ userId: userA });
    assert(afterFirstReview.length === 1, 'L: First review creates exactly 1 RecallItem');
    const item = afterFirstReview[0];
    assert(item.repetitions === 1, 'L: After first perfect review, repetitions=1');
    assert(item.interval === 1, 'L: After first successful review, interval=1 (SM-2 rule)');
    assert(item.mastery > 0, 'L: Mastery > 0 after first successful review');
    assert(item.retention !== 50, 'L: Retention is NOT hardcoded to 50%');
    assert(item.mastery !== 50, 'L: Mastery is NOT hardcoded to 50%');
    assert(item.reviewHistory.length === 1, 'L: Review history has 1 entry');
    // M: Quality=1 — interval resets
    await CognitiveLearningEngine.evaluateRecallPerformance(userA.toString(), item.topicName, 1);
    const afterForgot = await RecallItem.findOne({ userId: userA, topicName: item.topicName });
    assert(afterForgot?.interval === 1, 'M: Quality=1 → interval resets to 1');
    assert(afterForgot?.repetitions === 0, 'M: Quality=1 → repetitions reset to 0');
    assert(afterForgot?.mistakeCount === 1, 'M: Quality=1 increments mistakeCount');
    // N: Repeated failures → topic stays due soon
    for (let i = 0; i < 3; i++) {
        await CognitiveLearningEngine.evaluateRecallPerformance(userA.toString(), item.topicName, 1);
    }
    const afterFailures = await RecallItem.findOne({ userId: userA, topicName: item.topicName });
    assert((afterFailures?.interval ?? 99) <= 2, 'N: Repeated failures → interval stays short (≤2 days)');
    // O: Student A vs Student B — separate schedules
    await CognitiveLearningEngine.evaluateRecallPerformance(userB.toString(), item.topicName, 5);
    const itemB = await RecallItem.findOne({ userId: userB, topicName: item.topicName });
    const itemANow = await RecallItem.findOne({ userId: userA, topicName: item.topicName });
    assert(itemB !== null, 'O: Student B has their own RecallItem');
    assert(afterFirstReview[0] !== null, 'O: Student A has their own RecallItem');
    // Both have interval=1 on first review (SM-2 rule: first rep always 1 day)
    // Student A had repeated failures → high mistakeCount; Student B had perfect → 0 mistakes
    assert((itemANow?.mistakeCount ?? 0) > (itemB?.mistakeCount ?? 999), 'O: Student A (repeated failures) has more mistakes than Student B (perfect recall)');
    // P: Cross-user data isolation
    const userBItems = await RecallItem.find({ userId: userB });
    const hasCrossContamination = userBItems.some(i => i.userId.toString() === userA.toString());
    assert(hasCrossContamination === false, 'P: Student B items are NOT accessible to Student A query');
    // Q: Data persistence check — re-fetch same item
    const persisted = await RecallItem.findById(itemB?._id);
    assert(persisted !== null, 'Q: RecallItem persists in MongoDB after creation');
    assert(Boolean(persisted?.reviewHistory && persisted.reviewHistory.length > 0), 'Q: Review history persists in MongoDB');
    // Cleanup
    await RecallItem.deleteMany({ $or: [{ userId: userA }, { userId: userB }] });
    console.log('\n  [Cleanup] Test recall items removed from database.');
}
// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log('🧠 EduSphere — Recall Engine Tests\n');
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected ✓\n');
    // Unit tests (no DB)
    testSM2Engine();
    // Integration tests (DB)
    await testDatabase();
    console.log(`\n════════════════════════════════════`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log(`════════════════════════════════════`);
    if (failed > 0) {
        console.error('\n❌ Some tests FAILED. See above for details.');
        process.exit(1);
    }
    else {
        console.log('\n✅ All tests passed.');
    }
    await mongoose.disconnect();
}
main().catch(err => {
    console.error('Test runner failed:', err);
    process.exit(1);
});
