// backend/src/scripts/test_controlled_scenarios.mjs
// Proves: Different student behavior -> Different AI decision (Scenarios A through E)
// Proves Phase 2: Action completion on prerequisite dynamically changes student state and adapts downstream recommendation.

import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';
dotenv.config();

try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);
} catch (e) {}

const MONGO_URI = process.env.MONGO_URI;
const BASE_URL = 'http://localhost:5000/api';

const learningEventSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  eventType: String,
  topicId: String,
  subject: String,
  score: Number,
  duration: Number,
  metadata: Object,
  timestamp: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  email: String,
  attendanceRate: Number,
  weakSubjects: [String],
  name: String,
});

const LearningEvent = mongoose.models.LearningEvent || mongoose.model('LearningEvent', learningEventSchema, 'learningevents');
const User = mongoose.models.User || mongoose.model('User', userSchema, 'users');

async function runControlledScenarioTests() {
  console.log('======================================================================');
  console.log('🎯 EDUSPHERE ADAPTIVE INTELLIGENCE: 5-SCENARIO & STATE EVOLUTION AUDIT');
  console.log('======================================================================\n');

  await mongoose.connect(MONGO_URI, { family: 4, serverSelectionTimeoutMS: 15000 });
  console.log('✅ Connected to MongoDB Atlas cluster');

  // Authenticate student
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@edusphere.ai', password: 'EduSphere@2026' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  const userId = loginData.user.id || loginData.user._id;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  console.log(`✅ Authenticated Student ID: ${userId} (${loginData.user.name})\n`);

  const results = [];

  // ──────────────────────────────────────────────────────────────────
  // SCENARIO A: High Achiever (Strong Performance across modules)
  // Expected: Status OPTIMAL, 0 required interventions, standard pacing
  // ──────────────────────────────────────────────────────────────────
  console.log('----------------------------------------------------------------------');
  console.log('🧪 Scenario A: High Achiever (95% quiz scores, 90% attendance)');
  console.log('----------------------------------------------------------------------');

  await LearningEvent.deleteMany({ userId });
  await LearningEvent.create([
    { userId, eventType: 'QUIZ_COMPLETED', topicId: 'Data Structures', score: 95, duration: 600 },
    { userId, eventType: 'QUIZ_COMPLETED', topicId: 'Algorithms', score: 92, duration: 720 },
    { userId, eventType: 'TOPIC_MASTERED', topicId: 'Database Systems', score: 98, duration: 500 },
  ]);
  await User.findByIdAndUpdate(userId, { attendanceRate: 90, weakSubjects: [] });

  let resA = await fetch(`${BASE_URL}/eden/proactive-intervention`, { headers: authHeaders });
  let dataA = (await resA.json()).data;

  console.log(`AI Status: ${dataA.status}`);
  console.log(`Weak Topics Count: ${dataA.knowledgeGaps.weakTopics.length}`);
  console.log(`Scheduled Interventions: ${dataA.scheduledInterventions.length}`);
  console.log(`Decision Trace:\n   ${dataA.decisionTrace.join('\n   ')}`);

  const passA = dataA.status === 'OPTIMAL' && dataA.scheduledInterventions.length === 0;
  results.push({ scenario: 'A: High Achiever', pass: passA, note: 'OPTIMAL status, 0 interventions' });
  console.log(passA ? '✅ PASSED Scenario A\n' : '❌ FAILED Scenario A\n');

  // ──────────────────────────────────────────────────────────────────
  // SCENARIO B: Isolated Weakness in Dynamic Programming (Prerequisites Mastered)
  // Expected: Direct DP intervention, NOT prerequisite
  // ──────────────────────────────────────────────────────────────────
  console.log('----------------------------------------------------------------------');
  console.log('🧪 Scenario B: Isolated Weakness (Recursion Mastered, DP Struggling: 35%)');
  console.log('----------------------------------------------------------------------');

  await LearningEvent.deleteMany({ userId });
  await LearningEvent.create([
    { userId, eventType: 'QUIZ_COMPLETED', topicId: 'Recursion', score: 95, duration: 500 },
    { userId, eventType: 'QUIZ_COMPLETED', topicId: 'Dynamic Programming', score: 35, duration: 400 },
  ]);

  let resB = await fetch(`${BASE_URL}/eden/proactive-intervention`, { headers: authHeaders });
  let dataB = (await resB.json()).data;

  console.log(`AI Status: ${dataB.status}`);
  console.log(`Identified Weak Topics: [${dataB.knowledgeGaps.weakTopics.join(', ')}]`);
  console.log(`Target Topic: ${dataB.scheduledInterventions[0]?.topic}`);
  console.log(`Reason: ${dataB.scheduledInterventions[0]?.reason}`);
  console.log(`Decision Trace:\n   ${dataB.decisionTrace.join('\n   ')}`);

  const passB = dataB.status === 'ATTENTION_NEEDED' && dataB.scheduledInterventions[0]?.topic === 'Dynamic Programming';
  results.push({ scenario: 'B: Isolated DP Weakness', pass: passB, note: 'Directly targets Dynamic Programming' });
  console.log(passB ? '✅ PASSED Scenario B\n' : '❌ FAILED Scenario B\n');

  // ──────────────────────────────────────────────────────────────────
  // SCENARIO C: Compound Weakness (DP 35% + Recursion 40% Failed)
  // Expected: AI traverses KG and targets Recursion PREREQUISITE first!
  // ──────────────────────────────────────────────────────────────────
  console.log('----------------------------------------------------------------------');
  console.log('🧪 Scenario C: Compound Weakness (Struggling with both DP 35% AND Recursion 40%)');
  console.log('----------------------------------------------------------------------');

  await LearningEvent.deleteMany({ userId });
  await LearningEvent.create([
    { userId, eventType: 'QUIZ_COMPLETED', topicId: 'Dynamic Programming', score: 35, duration: 400 },
    { userId, eventType: 'QUIZ_COMPLETED', topicId: 'Recursion', score: 40, duration: 350 },
  ]);

  let resC = await fetch(`${BASE_URL}/eden/proactive-intervention`, { headers: authHeaders });
  let dataC = (await resC.json()).data;

  console.log(`AI Status: ${dataC.status}`);
  console.log(`Identified Weak Topics: [${dataC.knowledgeGaps.weakTopics.join(', ')}]`);
  console.log(`Target Topic: ${dataC.scheduledInterventions[0]?.topic}`);
  console.log(`Reason: ${dataC.scheduledInterventions[0]?.reason}`);
  console.log(`Decision Trace:\n   ${dataC.decisionTrace.join('\n   ')}`);

  const passC = dataC.status === 'ATTENTION_NEEDED' && dataC.scheduledInterventions[0]?.topic === 'Recursion';
  results.push({ scenario: 'C: Compound Weakness', pass: passC, note: 'Knowledge Graph routes to Recursion prerequisite' });
  console.log(passC ? '✅ PASSED Scenario C\n' : '❌ FAILED Scenario C\n');

  // ──────────────────────────────────────────────────────────────────
  // PHASE 2: Dynamic State Evolution (Student completes Recursion intervention)
  // Expected: Recursion is now MASTERED. Next recommendation shifts to DP!
  // ──────────────────────────────────────────────────────────────────
  console.log('----------------------------------------------------------------------');
  console.log('🔄 Phase 2: Dynamic State Progression (Student completes Recursion review)');
  console.log('----------------------------------------------------------------------');

  console.log('Simulating student completing 10-min active recall module on Recursion with rating 5 (100%)...');
  const completeRes = await fetch(`${BASE_URL}/eden/intervention/complete`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ topic: 'Recursion', rating: 5 }),
  });
  const completeJson = await completeRes.json();
  console.log(`Intervention Response: ${completeJson.message}`);

  let resAfter = await fetch(`${BASE_URL}/eden/proactive-intervention`, { headers: authHeaders });
  let dataAfter = (await resAfter.json()).data;

  console.log(`New Target Topic: ${dataAfter.scheduledInterventions[0]?.topic}`);
  console.log(`New Reason: ${dataAfter.scheduledInterventions[0]?.reason}`);
  console.log(`Decision Trace:\n   ${dataAfter.decisionTrace.join('\n   ')}`);

  const passPhase2 = dataAfter.scheduledInterventions[0]?.topic === 'Dynamic Programming';
  results.push({ scenario: 'Phase 2: State Progression', pass: passPhase2, note: 'Recommendation automatically adapted from Recursion -> DP' });
  console.log(passPhase2 ? '✅ PASSED Phase 2 State Progression\n' : '❌ FAILED Phase 2 State Progression\n');

  // ──────────────────────────────────────────────────────────────────
  // SCENARIO D: Disengagement / Inactive Learning Velocity
  // Expected: Engagement Check-in Intervention
  // ──────────────────────────────────────────────────────────────────
  console.log('----------------------------------------------------------------------');
  console.log('🧪 Scenario D: Inactivity / Disengagement (0 recent events in window)');
  console.log('----------------------------------------------------------------------');

  await LearningEvent.deleteMany({ userId });
  await User.findByIdAndUpdate(userId, { weakSubjects: [] });

  let resD = await fetch(`${BASE_URL}/eden/proactive-intervention`, { headers: authHeaders });
  let dataD = (await resD.json()).data;

  console.log(`AI Status: ${dataD.status}`);
  console.log(`Target Topic: ${dataD.scheduledInterventions[0]?.topic}`);
  console.log(`Action Resource: ${dataD.scheduledInterventions[0]?.actionableResource}`);
  console.log(`Decision Trace:\n   ${dataD.decisionTrace.join('\n   ')}`);

  const passD = dataD.status === 'ATTENTION_NEEDED' && dataD.scheduledInterventions[0]?.topic === 'Active Recall Check-in';
  results.push({ scenario: 'D: Inactivity Disengagement', pass: passD, note: 'Low-friction active recall check-in triggered' });
  console.log(passD ? '✅ PASSED Scenario D\n' : '❌ FAILED Scenario D\n');

  // ──────────────────────────────────────────────────────────────────
  // SCENARIO E: Attendance Shortage Risk (Attendance: 64% < 75%)
  // Expected: CRITICAL_INTERVENTION, Attendance Recovery alert
  // ──────────────────────────────────────────────────────────────────
  console.log('----------------------------------------------------------------------');
  console.log('🧪 Scenario E: Attendance Shortage Risk (64% attendance rate)');
  console.log('----------------------------------------------------------------------');

  await User.findByIdAndUpdate(userId, { attendanceRate: 64 });

  let resE = await fetch(`${BASE_URL}/eden/proactive-intervention`, { headers: authHeaders });
  let dataE = (await resE.json()).data;

  console.log(`AI Status: ${dataE.status}`);
  console.log(`Target Topic: ${dataE.scheduledInterventions[0]?.topic}`);
  console.log(`Reason: ${dataE.scheduledInterventions[0]?.reason}`);
  console.log(`Action: ${dataE.scheduledInterventions[0]?.actionableResource}`);
  console.log(`Decision Trace:\n   ${dataE.decisionTrace.join('\n   ')}`);

  const passE = dataE.status === 'CRITICAL_INTERVENTION' && dataE.scheduledInterventions[0]?.topic === 'Attendance Recovery';
  results.push({ scenario: 'E: Attendance Shortage Risk', pass: passE, note: 'CRITICAL_INTERVENTION with exact class count needed' });
  console.log(passE ? '✅ PASSED Scenario E\n' : '❌ FAILED Scenario E\n');

  // Restore normal student state
  await User.findByIdAndUpdate(userId, { attendanceRate: 88 });
  await LearningEvent.create([
    { userId, eventType: 'QUIZ_COMPLETED', topicId: 'Data Structures', score: 88, duration: 600 },
    { userId, eventType: 'QUIZ_COMPLETED', topicId: 'Algorithms', score: 85, duration: 600 },
  ]);

  // Summary Table
  console.log('======================================================================');
  console.log('📊 AUDIT SUMMARY TABLE');
  console.log('======================================================================');
  results.forEach(r => {
    console.log(`${r.pass ? '✅ PASS' : '❌ FAIL'} | ${r.scenario.padEnd(30)} | ${r.note}`);
  });
  console.log('======================================================================');

  const allPassed = results.every(r => r.pass);
  if (allPassed) {
    console.log('🎉 ALL CONTROLLED SCENARIOS & DYNAMIC STATE EVOLUTIONS VERIFIED!');
  } else {
    console.error('⚠️ SOME SCENARIOS FAILED VERIFICATION');
    process.exit(1);
  }

  await mongoose.disconnect();
}

runControlledScenarioTests().catch(err => {
  console.error('Fatal error in scenario tests:', err);
  process.exit(1);
});
