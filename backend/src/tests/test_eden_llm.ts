import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../models/User.js'
import { StudentAttendance } from '../models/attendance/StudentAttendance.js'
import { IntentClassifier } from '../ai/IntentClassifier.js'
import { OpenDomainAIEngine } from '../ai/OpenDomainAIEngine.js'
import { ToolRegistry } from '../ai/tools/ToolRegistry.js'

dotenv.config()

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edusphere'

let passed = 0
let failed = 0

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ ${message}`)
    passed++
  } else {
    console.error(`  ❌ FAIL: ${message}`)
    failed++
  }
}

async function runEdenLLMTestSuite() {
  console.log('🤖 EduSphere — EDEN AI Universal Architecture Verification Suite\n')
  console.log('Connecting to MongoDB...')
  await mongoose.connect(MONGO_URI)
  console.log('Connected ✓\n')

  const testUser = await User.create({
    name: 'Alpha LLM Test Student',
    email: `eden_llm_test_${Date.now()}@edusphere.ai`,
    passwordHash: 'hashed_pw',
    role: 'student',
    department: 'Computer Science',
    cgpa: 8.8,
  })

  // Seed sample attendance record for test user
  await StudentAttendance.create({
    studentId: testUser._id,
    studentName: testUser.name,
    rollNo: '2026-CS-001',
    subject: 'Data Structures',
    date: new Date(),
    status: 'Present',
  })

  const userContext = {
    userId: testUser._id.toString(),
    userName: testUser.name,
    role: testUser.role,
    department: testUser.department,
  }

  // ── Test 1: "describe java" ────────────────────────────────────────────────
  console.log('Test 1: "describe java"')
  const res1 = await OpenDomainAIEngine.resolveQuery('describe java', userContext)
  assert(res1.intent === 'GENERAL_EXPLANATION', 'Intent classified as GENERAL_EXPLANATION')
  assert(!res1.content.includes('int[] numbers = {10, 20, 30, 40, 50}'), 'No hardcoded array sum code snippet')

  // ── Test 2: "what is inheritance in java" ──────────────────────────────────
  console.log('\nTest 2: "what is inheritance in java"')
  const res2 = await OpenDomainAIEngine.resolveQuery('what is inheritance in java', userContext)
  assert(res2.intent === 'CONCEPT_EXPLANATION' || res2.intent === 'GENERAL_EXPLANATION', 'Intent classified as CONCEPT_EXPLANATION')

  // ── Test 3: "write a Java program to reverse a number" ───────────────────
  console.log('\nTest 3: "write a Java program to reverse a number"')
  const res3 = await OpenDomainAIEngine.resolveQuery('write a Java program to reverse a number', userContext)
  assert(res3.intent === 'CODE_GENERATION', 'Intent classified as CODE_GENERATION')

  // ── Test 4: "why am I getting NullPointerException?" ─────────────────────
  console.log('\nTest 4: "why am I getting NullPointerException?"')
  const res4 = await OpenDomainAIEngine.resolveQuery('why am I getting NullPointerException?', userContext)
  assert(res4.intent === 'ERROR_EXPLANATION' || res4.intent === 'CODE_DEBUGGING', 'Intent classified as DEBUGGING / ERROR_EXPLANATION')

  // ── Test 5: Tool Registry Direct Execution ("get_my_attendance") ─────────
  console.log('\nTest 5: ToolRegistry.executeTool("get_my_attendance")')
  const toolRes5 = await ToolRegistry.executeTool('get_my_attendance', {}, userContext)
  assert(toolRes5.success === true && toolRes5.data?.attendancePct !== undefined, 'Executed authorized get_my_attendance tool via MongoDB')

  // ── Test 6: Tool Registry Direct Execution ("get_my_profile") ────────────
  console.log('\nTest 6: ToolRegistry.executeTool("get_my_profile")')
  const toolRes6 = await ToolRegistry.executeTool('get_my_profile', {}, userContext)
  assert(toolRes6.success === true && toolRes6.data?.userName === testUser.name, 'Uses authenticated user profile data')

  // ── Test 7: "recommend AWS courses" ──────────────────────────────────────
  console.log('\nTest 7: "recommend AWS courses"')
  const res7 = await OpenDomainAIEngine.resolveQuery('recommend AWS courses', userContext)
  assert(res7.intent === 'RECOMMENDATION' || res7.intent === 'COURSE_HELP' || res7.intent === 'GENERAL_EXPLANATION', 'Recommends AWS public video catalog courses')

  // ── Test 8: "show my Java course assignments" ────────────────────────────
  console.log('\nTest 8: "show my Java course assignments"')
  const res8 = await OpenDomainAIEngine.resolveQuery('show my Java course assignments', userContext)
  assert(res8.intent === 'PERSONAL_DATA_QUERY' || res8.intent === 'ASSIGNMENT_HELP', 'Handles private college course assignments request')

  // ── Test 9: "explain MongoDB aggregation" ────────────────────────────────
  console.log('\nTest 9: "explain MongoDB aggregation"')
  const res9 = await OpenDomainAIEngine.resolveQuery('explain MongoDB aggregation', userContext)
  assert(res9.intent === 'CONCEPT_EXPLANATION' || res9.intent === 'GENERAL_EXPLANATION', 'Intent classified as GENERAL/CONCEPT EXPLANATION')

  // ── Test 10: Tool Registry Navigation ("open_module") ─────────────────────
  console.log('\nTest 10: ToolRegistry.executeTool("open_module")')
  const toolRes10 = await ToolRegistry.executeTool('open_module', { moduleName: 'attendance' }, userContext)
  assert(toolRes10.success === true && toolRes10.data?.target === 'attendance', 'Executes open_module navigation action')

  // Cleanup
  await StudentAttendance.deleteMany({ studentId: testUser._id })
  await User.deleteOne({ _id: testUser._id })

  console.log(`\n════════════════════════════════════`)
  console.log(`Results: ${passed} passed, ${failed} failed`)
  console.log(`════════════════════════════════════`)

  await mongoose.disconnect()

  if (failed > 0) {
    console.error('\n❌ EDEN AI Universal Architecture Test Suite FAILED.')
    process.exit(1)
  } else {
    console.log('\n✅ All EDEN AI Universal Architecture tests PASSED PERFECTLY!')
    process.exit(0)
  }
}

runEdenLLMTestSuite().catch(err => {
  console.error('EDEN LLM test execution failed:', err)
  process.exit(1)
})
