import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { CollegeCourse, CollegeCourseEnrollment } from '../models/CollegeCourse.js';
import { VideoCourse, VideoProgress, VideoCertificate } from '../models/VideoCourse.js';
import { CollegeCourseController } from '../controllers/collegeCourseController.js';
import { VideoCourseController } from '../controllers/videoCourseController.js';
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
function section(label) {
    console.log(`\n────────────────────────────────────────────`);
    console.log(`🧪 ${label}`);
    console.log(`────────────────────────────────────────────`);
}
async function runTests() {
    console.log('🎓 EduSphere — Dual Course Ecosystem Verification Suite\n');
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected ✓\n');
    // Setup test users
    const studentA = new mongoose.Types.ObjectId();
    const studentB = new mongoose.Types.ObjectId();
    const facultyId = new mongoose.Types.ObjectId();
    // Clean test artifacts
    await CollegeCourse.deleteMany({ courseCode: /^TEST-CC/ });
    await CollegeCourseEnrollment.deleteMany({ $or: [{ userId: studentA }, { userId: studentB }] });
    await VideoCourse.deleteMany({ slug: /^test-vc/ });
    await VideoProgress.deleteMany({ $or: [{ userId: studentA }, { userId: studentB }] });
    await VideoCertificate.deleteMany({ $or: [{ userId: studentA }, { userId: studentB }] });
    // Create test college course
    const testCollegeCourse = await CollegeCourse.create({
        courseCode: 'TEST-CC-101',
        title: 'Advanced Compiler Optimization',
        department: 'Computer Science',
        semester: 7,
        credits: 4,
        instructorId: facultyId,
        instructorName: 'Dr. Test Instructor',
        description: 'Test academic course',
        status: 'active'
    });
    // Enroll ONLY Student A
    await CollegeCourseEnrollment.create({
        userId: studentA,
        collegeCourseId: testCollegeCourse._id,
        courseCode: 'TEST-CC-101',
        department: 'Computer Science',
        section: 'A',
        semester: 7,
        status: 'active'
    });
    // Create test public video course
    const testVideoCourse = await VideoCourse.create({
        slug: 'test-vc-kubernetes-mastery',
        title: 'Test Kubernetes Mastery',
        description: 'Test public video course',
        instructorName: 'DevOps Lead',
        category: 'Cloud',
        level: 'Advanced',
        durationHours: 10,
        skills: ['Kubernetes'],
        published: true,
        sections: [
            {
                sectionId: 's1',
                title: 'Section 1: Pods & Services',
                lessons: [
                    { lessonId: 'l1', title: 'Pod Architecture', durationMinutes: 10, videoUrl: 'http://test/v1.mp4', description: 'Pod intro' },
                    { lessonId: 'l2', title: 'Service Mesh', durationMinutes: 15, videoUrl: 'http://test/v2.mp4', description: 'Service intro' }
                ]
            }
        ]
    });
    // ── 1. TEST COLLEGE COURSE ACCESS & ISOLATION ──────────────────────────────
    section('1. Type 1 College Course Isolation & Access');
    // Mock Request for Student A
    const reqA = { user: { _id: studentA, role: 'student' }, params: { courseId: testCollegeCourse._id.toString() } };
    let resDataA = null;
    const mockResA = {
        json: (d) => { resDataA = d; },
        status: function (code) { return this; }
    };
    await CollegeCourseController.getCollegeCourseById(reqA, mockResA);
    assert(resDataA?.success === true, 'Student A can access enrolled college course (TEST-CC-101)');
    assert(resDataA?.data?.course?.title === 'Advanced Compiler Optimization', 'Student A receives correct course syllabus & details');
    // Mock Request for Student B (Unenrolled)
    const reqB = { user: { _id: studentB, role: 'student' }, params: { courseId: testCollegeCourse._id.toString() } };
    let resDataB = null;
    let statusCodeB = 200;
    const mockResB = {
        json: (d) => { resDataB = d; },
        status: function (code) { statusCodeB = code; return this; }
    };
    await CollegeCourseController.getCollegeCourseById(reqB, mockResB);
    assert(statusCodeB === 403 || resDataB?.success === false, 'Student B is DENIED access to Student A\'s college course (HTTP 403 Forbidden)');
    // ── 2. TEST PUBLIC VIDEO COURSES & USER PROGRESS ISOLATION ───────────────────
    section('2. Type 2 Public Video Courses & Progress Isolation');
    // Public Catalog Browsing (No Auth required)
    const reqPublic = { query: {} };
    let publicRes = null;
    const mockResPub = { json: (d) => { publicRes = d; } };
    await VideoCourseController.getCatalog(reqPublic, mockResPub);
    assert(publicRes?.success === true, 'Public video course catalog is browseable without login');
    assert(publicRes?.data?.courses?.some((c) => c.slug === 'test-vc-kubernetes-mastery'), 'Public catalog contains published video courses');
    // Record Progress for Student A (100% completion)
    const reqProgA = {
        user: { _id: studentA, name: 'Student A' },
        params: { courseSlug: 'test-vc-kubernetes-mastery' },
        body: { lessonId: 'l1', isCompleted: true }
    };
    let progResA = null;
    const mockResProgA = { json: (d) => { progResA = d; } };
    await VideoCourseController.updateProgress(reqProgA, mockResProgA);
    const reqProgA2 = {
        user: { _id: studentA, name: 'Student A' },
        params: { courseSlug: 'test-vc-kubernetes-mastery' },
        body: { lessonId: 'l2', isCompleted: true }
    };
    await VideoCourseController.updateProgress(reqProgA2, mockResProgA);
    assert(progResA?.data?.completionPct === 100, 'Student A reaches 100% video course completion');
    // Verify Student B has independent progress (0%)
    const reqProgBGet = {
        user: { _id: studentB, name: 'Student B' },
        params: { courseSlug: 'test-vc-kubernetes-mastery' }
    };
    let progResBGet = null;
    const mockResProgBGet = { json: (d) => { progResBGet = d; } };
    await VideoCourseController.getProgress(reqProgBGet, mockResProgBGet);
    assert(progResBGet?.data?.progress?.completionPct === 0, 'Student B has independent 0% video course progress');
    // ── 3. TEST CERTIFICATE ISSUANCE ─────────────────────────────────────────────
    section('3. Certificate Generation & Authorization');
    const reqCertA = {
        user: { _id: studentA, name: 'Student A' },
        params: { courseSlug: 'test-vc-kubernetes-mastery' }
    };
    let certResA = null;
    const mockResCertA = { json: (d) => { certResA = d; } };
    await VideoCourseController.getCertificate(reqCertA, mockResCertA);
    assert(certResA?.success === true, 'Student A earns verified completion certificate after 100% video progress');
    assert(certResA?.data?.certificate?.studentName === 'Student A', 'Certificate correctly binds to Student A');
    // Student B attempts to fetch certificate at 0% completion
    const reqCertB = {
        user: { _id: studentB, name: 'Student B' },
        params: { courseSlug: 'test-vc-kubernetes-mastery' }
    };
    let certResB = null;
    let certStatusB = 200;
    const mockResCertB = {
        json: (d) => { certResB = d; },
        status: function (code) { certStatusB = code; return this; }
    };
    await VideoCourseController.getCertificate(reqCertB, mockResCertB);
    assert(certStatusB === 400 || certResB?.success === false, 'Student B cannot claim certificate without 100% course completion (HTTP 400)');
    // ── CLEANUP ──────────────────────────────────────────────────────────────────
    await CollegeCourse.deleteMany({ courseCode: /^TEST-CC/ });
    await CollegeCourseEnrollment.deleteMany({ $or: [{ userId: studentA }, { userId: studentB }] });
    await VideoCourse.deleteMany({ slug: /^test-vc/ });
    await VideoProgress.deleteMany({ $or: [{ userId: studentA }, { userId: studentB }] });
    await VideoCertificate.deleteMany({ $or: [{ userId: studentA }, { userId: studentB }] });
    console.log(`\n════════════════════════════════════`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log(`════════════════════════════════════`);
    await mongoose.disconnect();
    if (failed > 0) {
        console.error('\n❌ Test suite failed.');
        process.exit(1);
    }
    else {
        console.log('\n✅ All Dual Ecosystem & User Isolation tests passed!');
        process.exit(0);
    }
}
runTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
});
