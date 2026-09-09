import dotenv from 'dotenv'
dotenv.config()

import dns from 'dns'
try { dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']) } catch {}

import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import { connectDB } from '../config/db.js'
import User from '../models/User.js'
import { AcademicResult } from '../models/AcademicResult.js'
import { AcademicResultController } from '../controllers/academicResultController.js'
import { ToolRegistry } from '../ai/tools/ToolRegistry.js'

const JWT_SECRET = process.env.JWT_SECRET || 'edusphere_jwt_secret_key_2026'

async function runAcademicResultE2ETest() {
  console.log('════════════════════════════════════════════════════════════')
  console.log('🧪 Starting Academic Result Engine, Gradebook & CGPA E2E Test...')
  console.log('════════════════════════════════════════════════════════════\n')

  await connectDB()

  try {
    // ── Step 1: Setup Test Accounts ──────────────────────────────────────
    console.log('1️⃣ Setting up test student & faculty in MongoDB...')
    const studentA = await User.findOneAndUpdate(
      { email: 'gradebook_student_a@edusphere.ai' },
      {
        name: 'Gradebook Student A',
        email: 'gradebook_student_a@edusphere.ai',
        passwordHash: 'dummyhash',
        role: 'student',
        department: 'Computer Science & Engineering',
        rollNumber: 'CS2026-GRADE-A',
        isActive: true,
      },
      { upsert: true, new: true }
    )

    const studentB = await User.findOneAndUpdate(
      { email: 'gradebook_student_b@edusphere.ai' },
      {
        name: 'Gradebook Student B',
        email: 'gradebook_student_b@edusphere.ai',
        passwordHash: 'dummyhash',
        role: 'student',
        department: 'Computer Science & Engineering',
        rollNumber: 'CS2026-GRADE-B',
        isActive: true,
      },
      { upsert: true, new: true }
    )

    const faculty = await User.findOneAndUpdate(
      { email: 'gradebook_faculty@edusphere.ai' },
      {
        name: 'Faculty Gradebook Admin',
        email: 'gradebook_faculty@edusphere.ai',
        passwordHash: 'dummyhash',
        role: 'faculty',
        department: 'Computer Science & Engineering',
        isActive: true,
      },
      { upsert: true, new: true }
    )

    console.log(`   ✅ Student A ID: ${studentA._id}`)
    console.log(`   ✅ Student B ID: ${studentB._id}\n`)

    // Clean prior academic results
    await AcademicResult.deleteMany({ studentId: { $in: [studentA._id, studentB._id] } })

    // ── Step 2: Faculty Records 3 Course Grades for Student A ────────────
    console.log('2️⃣ Faculty recording grades for 3 courses in Semester 5...')

    const mockRes: any = { status: () => mockRes, json: (d: any) => d }

    // Course 1: Data Structures (4 credits): 35 int + 55 end = 90 (Grade S, 10 pts)
    await AcademicResultController.recordCourseGrade({
      user: faculty,
      body: {
        studentId: studentA._id.toString(),
        semester: 5,
        courseCode: 'CS501',
        courseTitle: 'Data Structures & Algorithms',
        credits: 4,
        internalMarks: 35,
        endSemMarks: 55,
      }
    } as any, mockRes)

    // Course 2: Operating Systems (4 credits): 30 int + 45 end = 75 (Grade B, 8 pts)
    await AcademicResultController.recordCourseGrade({
      user: faculty,
      body: {
        studentId: studentA._id.toString(),
        semester: 5,
        courseCode: 'CS502',
        courseTitle: 'Operating Systems',
        credits: 4,
        internalMarks: 30,
        endSemMarks: 45,
      }
    } as any, mockRes)

    // Course 3: Database Systems (4 credits): 32 int + 48 end = 80 (Grade A, 9 pts)
    await AcademicResultController.recordCourseGrade({
      user: faculty,
      body: {
        studentId: studentA._id.toString(),
        semester: 5,
        courseCode: 'CS503',
        courseTitle: 'Database Management Systems',
        credits: 4,
        internalMarks: 32,
        endSemMarks: 48,
      }
    } as any, mockRes)

    console.log('   ✅ 3 course grades recorded for Semester 5.\n')

    // ── Step 3: Verify SGPA & CGPA Calculation in MongoDB ───────────────
    console.log('3️⃣ Verifying SGPA & Cumulative CGPA Calculation in MongoDB...')
    const sem5Result: any = await AcademicResult.findOne({ studentId: studentA._id, semester: 5 }).lean()

    console.log(`   📊 Calculated Semester 5 SGPA: ${sem5Result?.sgpa} (Expected: 9)`)
    console.log(`   📊 Calculated Cumulative CGPA: ${sem5Result?.cgpa} (Expected: 9)`)
    console.log(`   📊 Total Credits Earned: ${sem5Result?.totalCreditsEarned} credits`)

    if (sem5Result?.sgpa === 9 && sem5Result?.cgpa === 9) {
      console.log('   ✅ MATHEMATICAL GRADEBOOK CALCULATION PASSED!\n')
    } else {
      console.error(`   ❌ Gradebook calculation failed: expected SGPA 9.0, got ${sem5Result?.sgpa}`)
      process.exit(1)
    }

    // ── Step 4: Verify Transcript API ─────────────────────────────────────
    console.log('4️⃣ Executing getStudentTranscript API call...')
    const transcriptRes = await AcademicResultController.getStudentTranscript({
      user: studentA,
      params: { studentId: studentA._id.toString() }
    } as any, mockRes)

    const data = (transcriptRes as any).data
    console.log(`   📜 Transcript Data: CGPA=${data?.cgpa}, Credits=${data?.totalCreditsEarned}, Semesters=${data?.semesters?.length}`)

    if (data?.hasData && data?.cgpa === 9) {
      console.log('   ✅ OFFICIAL TRANSCRIPT GENERATION PASSED!\n')
    } else {
      console.error('   ❌ Transcript generation failed!')
      process.exit(1)
    }

    // ── Step 5: Test EDEN Transcript Tool Execution (get_my_transcript) ───
    console.log('5️⃣ Testing EDEN tool execution (get_my_transcript)...')
    const edenToolRes = await ToolRegistry.executeTool(
      'get_my_transcript',
      {},
      { userId: studentA._id.toString(), role: 'student', userName: studentA.name }
    )

    console.log(`   🤖 Tool Output:`, edenToolRes.data)

    if (edenToolRes.success && edenToolRes.data?.cgpa === 9) {
      console.log('   ✅ EDEN TRANSCRIPT TOOL INTEGRATION PASSED!\n')
    } else {
      console.error('   ❌ EDEN transcript tool failed!')
      process.exit(1)
    }

    // ── Step 6: Security Check — Horizontal Transcript Isolation ─────────
    console.log('6️⃣ Testing Security: Student A requesting Student B transcript...')
    let is403 = false
    const securityRes = await AcademicResultController.getStudentTranscript({
      user: studentA,
      params: { studentId: studentB._id.toString() }
    } as any, {
      status: (code: number) => { if (code === 403) is403 = true; return mockRes },
      json: (d: any) => d
    } as any)

    if (is403) {
      console.log('   🔒 TRANSCRIPT SECURITY PASSED: Access blocked with 403 Forbidden!\n')
    } else {
      console.error('   ❌ TRANSCRIPT SECURITY FAILED: Cross-student transcript leak!')
      process.exit(1)
    }

    // Cleanup test records
    await User.deleteMany({ _id: { $in: [studentA._id, studentB._id, faculty._id] } })
    await AcademicResult.deleteMany({ studentId: { $in: [studentA._id, studentB._id] } })

    console.log('════════════════════════════════════════════════════════════')
    console.log('🎉 ALL ACADEMIC RESULT ENGINE & GRADEBOOK TESTS PASSED PERFECTLY!')
    console.log('════════════════════════════════════════════════════════════')
    process.exit(0)

  } catch (err: any) {
    console.error('❌ Academic result test execution failed:', err.message, err.stack)
    process.exit(1)
  }
}

runAcademicResultE2ETest()
