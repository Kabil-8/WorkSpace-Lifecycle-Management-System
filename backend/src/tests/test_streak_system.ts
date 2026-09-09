import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../models/User.js'
import Gamification from '../models/Gamification.js'
import { StreakService } from '../services/StreakService.js'

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

async function runStreakTests() {
  console.log('🔥 EduSphere — Daily Activity Streak Engine Verification Suite\n')
  console.log('Connecting to MongoDB...')
  await mongoose.connect(MONGO_URI)
  console.log('Connected ✓\n')

  const testUser = await User.create({
    name: 'Streak Test Student',
    email: `streak_test_${Date.now()}@edusphere.ai`,
    passwordHash: 'hashed_pw',
    role: 'student',
    streak: 0,
    maxStreak: 0,
  })

  // Test 1: First activity -> Streak = 1
  const r1 = await StreakService.touchStreak(testUser._id)
  assert(r1.streak === 1, 'First user activity sets streak to 1')
  assert(r1.maxStreak === 1, 'First user activity sets maxStreak to 1')

  // Test 2: Same calendar day -> Streak remains 1
  const r2 = await StreakService.touchStreak(testUser._id)
  assert(r2.streak === 1, 'Activity on same calendar day keeps streak unchanged at 1')

  // Test 3: Activity on consecutive day (yesterday) -> Streak = 2
  const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000)
  await Gamification.updateOne({ userId: testUser._id }, { lastActiveDate: yesterday })

  const r3 = await StreakService.touchStreak(testUser._id)
  assert(r3.streak === 2, 'Activity on consecutive calendar day increments streak to 2')
  assert(r3.maxStreak === 2, 'maxStreak updates to 2')

  // Test 4: Inactivity for 3 days -> Streak resets to 1
  const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000)
  await Gamification.updateOne({ userId: testUser._id }, { lastActiveDate: threeDaysAgo })

  const r4 = await StreakService.touchStreak(testUser._id)
  assert(r4.streak === 1, 'Activity after 3 days of inactivity resets streak to 1')
  assert(r4.maxStreak === 2, 'maxStreak is preserved at highest streak (2)')

  // Cleanup
  await User.deleteOne({ _id: testUser._id })
  await Gamification.deleteOne({ userId: testUser._id })

  console.log(`\n════════════════════════════════════`)
  console.log(`Results: ${passed} passed, ${failed} failed`)
  console.log(`════════════════════════════════════`)

  await mongoose.disconnect()

  if (failed > 0) {
    console.error('\n❌ Streak system test FAILED.')
    process.exit(1)
  } else {
    console.log('\n✅ All Daily Streak System tests PASSED!')
    process.exit(0)
  }
}

runStreakTests().catch(err => {
  console.error('Streak test execution failed:', err)
  process.exit(1)
})
