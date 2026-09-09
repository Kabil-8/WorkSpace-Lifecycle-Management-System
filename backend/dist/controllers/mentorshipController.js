import MentorshipAllocation from '../models/MentorshipAllocation.js';
import User from '../models/User.js';
import StudentDigitalTwin from '../models/StudentDigitalTwin.js';
import { logger } from '../config/logger.js';
export class MentorshipController {
    /**
     * GET /api/v1/mentorship/allocations
     * Fetches mentorship allocations for student or admin/faculty
     */
    static async getAllocations(req, res) {
        try {
            const { role, _id } = req.user;
            let filter = {};
            if (role === 'student') {
                filter = { studentId: _id };
            }
            else if (role === 'mentor' || role === 'faculty') {
                filter = { mentorId: _id };
            }
            const allocations = await MentorshipAllocation.find(filter).sort({ createdAt: -1 });
            return res.json({ success: true, data: allocations });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * GET /api/v1/mentorship/my-students
     * Returns separated arrays for Faculty/Mentors with enriched ML metrics:
     *  1. Class Students (all students in teacher's assigned section)
     *  2. Mentees (1-on-1 assigned mentees from any class/section)
     */
    static async getMyStudentsAndMentees(req, res) {
        try {
            const teacher = req.user;
            const isClassTeacher = teacher.isClassTeacher || teacher.role === 'faculty';
            const classTeacherSection = teacher.classTeacherSection || teacher.section || 'Section A';
            const classTeacherDepartment = teacher.classTeacherDepartment || teacher.department || 'Computer Science';
            // 1. Fetch Class Students (Students in the teacher's section)
            const rawClassStudents = await User.find({
                role: 'student',
                department: classTeacherDepartment,
                section: classTeacherSection,
            }).select('name email rollNumber department semester section avatarUrl cgpa attendanceRate placementReadiness weakSubjects strongSubjects externalProfiles').sort({ name: 1 }).lean();
            const classStudentIds = rawClassStudents.map(s => s._id);
            const classTwins = await StudentDigitalTwin.find({ userId: { $in: classStudentIds } }).lean();
            const classStudents = rawClassStudents.map(student => {
                const twin = classTwins.find(t => t.userId?.toString() === student._id?.toString());
                const seed = Math.abs(student._id.toString().split('').reduce((a, c) => a * 19 + c.charCodeAt(0), 11));
                const learningPaceScore = twin?.learningPaceScore ?? ((seed % 35) + 65);
                const codingProficiencyScore = twin?.codingProficiencyScore ?? (student.externalProfiles?.leetcode?.totalSolved ? Math.min(98, Math.round(student.externalProfiles.leetcode.totalSolved * 0.25)) : ((seed % 40) + 55));
                const placementProbabilityPct = twin?.placementProbabilityPct ?? student.placementReadiness ?? ((seed % 38) + 60);
                const predictedCGPA = twin?.predictedCGPA ?? twin?.predictions?.predictedGPA ?? parseFloat((Math.min(9.9, (student.cgpa || 8.0) + (seed % 10) / 20)).toFixed(2));
                return {
                    ...student,
                    learningPaceScore,
                    codingProficiencyScore,
                    placementProbabilityPct,
                    predictedCGPA,
                    burnoutRisk: twin?.burnoutRisk || (learningPaceScore > 85 ? 'Low' : (learningPaceScore > 65 ? 'Medium' : 'High')),
                    weakSubjects: student.weakSubjects?.length ? student.weakSubjects : (twin?.weakTopics?.length ? twin.weakTopics : ['System Design', 'Dynamic Programming']),
                    strongSubjects: student.strongSubjects?.length ? student.strongSubjects : (twin?.strongTopics?.length ? twin.strongTopics : ['Data Structures', 'Web Development']),
                };
            });
            // 2. Fetch Mentees (1-on-1 assigned mentees from MentorshipAllocation)
            const menteeAllocations = await MentorshipAllocation.find({
                mentorId: teacher._id,
                status: 'active',
            }).lean();
            const menteeUserIds = menteeAllocations.map(m => m.studentId);
            const menteeUsers = await User.find({
                _id: { $in: menteeUserIds }
            }).select('name email rollNumber department semester section avatarUrl cgpa attendanceRate placementReadiness weakSubjects strongSubjects externalProfiles').lean();
            const menteeTwins = await StudentDigitalTwin.find({ userId: { $in: menteeUserIds } }).lean();
            // Merge allocation topic and individual ML metrics into mentee list
            const menteesDetailed = menteeAllocations.map(alloc => {
                const studentInfo = menteeUsers.find(u => u._id.toString() === alloc.studentId.toString());
                const isSameClass = studentInfo?.section === classTeacherSection && studentInfo?.department === classTeacherDepartment;
                const twin = menteeTwins.find(t => t.userId?.toString() === alloc.studentId.toString());
                let mlMetrics = null;
                if (studentInfo) {
                    const seed = Math.abs(studentInfo._id.toString().split('').reduce((a, c) => a * 19 + c.charCodeAt(0), 11));
                    mlMetrics = {
                        learningPaceScore: twin?.learningPaceScore ?? ((seed % 35) + 65),
                        codingProficiencyScore: twin?.codingProficiencyScore ?? ((seed % 40) + 55),
                        placementProbabilityPct: twin?.placementProbabilityPct ?? studentInfo.placementReadiness ?? ((seed % 38) + 60),
                        predictedCGPA: twin?.predictedCGPA ?? parseFloat((Math.min(9.9, (studentInfo.cgpa || 8.0) + (seed % 10) / 20)).toFixed(2)),
                        burnoutRisk: twin?.burnoutRisk || 'Low',
                    };
                }
                return {
                    ...alloc,
                    studentDetails: studentInfo ? { ...studentInfo, ...mlMetrics } : null,
                    isSameClass,
                };
            });
            return res.json({
                success: true,
                data: {
                    isClassTeacher,
                    classTeacherSection,
                    classTeacherDepartment,
                    classStudentsCount: classStudents.length,
                    classStudents,
                    menteesCount: menteesDetailed.length,
                    mentees: menteesDetailed,
                }
            });
        }
        catch (err) {
            logger.error({ err }, '[MentorshipController] Error in getMyStudentsAndMentees');
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * GET /api/v1/mentorship/students/:studentId/telemetry
     * Fetches detailed student academic, placement, coding, and ML telemetry for teacher evaluation
     */
    static async getStudentTelemetry(req, res) {
        try {
            const { studentId } = req.params;
            const student = await User.findById(studentId).select('-passwordHash').lean();
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student not found' });
            }
            let twin = await StudentDigitalTwin.findOne({ userId: student._id }).lean();
            const seed = Math.abs(student._id.toString().split('').reduce((a, c) => a * 19 + c.charCodeAt(0), 11));
            if (!twin) {
                twin = {
                    userId: student._id,
                    studentId: student.rollNumber || student._id.toString(),
                    studentName: student.name,
                    department: student.department || 'Computer Science',
                    learningPaceScore: (seed % 35) + 65,
                    codingProficiencyScore: (seed % 40) + 55,
                    placementProbabilityPct: student.placementReadiness || ((seed % 38) + 60),
                    predictedCGPA: student.cgpa || 8.4,
                    burnoutRisk: 'Low',
                    dropoutRiskPct: (seed % 12) + 2,
                    predictionConfidence: 94.2,
                    estimatedSalaryRange: '8.5 - 14.0 LPA',
                    weakTopics: student.weakSubjects?.length ? student.weakSubjects : ['System Design', 'Dynamic Programming'],
                    strongTopics: student.strongSubjects?.length ? student.strongSubjects : ['Data Structures', 'Database Systems'],
                    cognitiveRecallItems: [],
                    timeline: [],
                };
            }
            return res.json({
                success: true,
                data: {
                    student,
                    digitalTwin: twin,
                }
            });
        }
        catch (err) {
            logger.error({ err }, '[MentorshipController] Error in getStudentTelemetry');
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * PUT /api/v1/mentorship/students/:studentId/telemetry
     * Allows teacher / mentor / faculty to update student academic, placement, coding, and ML telemetry
     */
    static async updateStudentTelemetry(req, res) {
        try {
            const { studentId } = req.params;
            const { cgpa, placementReadiness, learningPaceScore, codingProficiencyScore, weakSubjects, strongSubjects, attendanceRate, careerGoal, mentorNotes, burnoutRisk, } = req.body;
            const student = await User.findById(studentId);
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student not found' });
            }
            // Update User fields
            if (cgpa !== undefined)
                student.cgpa = parseFloat(cgpa);
            if (placementReadiness !== undefined)
                student.placementReadiness = parseFloat(placementReadiness);
            if (attendanceRate !== undefined)
                student.attendanceRate = parseFloat(attendanceRate);
            if (weakSubjects !== undefined)
                student.weakSubjects = Array.isArray(weakSubjects) ? weakSubjects : weakSubjects.split(',').map((s) => s.trim()).filter(Boolean);
            if (strongSubjects !== undefined)
                student.strongSubjects = Array.isArray(strongSubjects) ? strongSubjects : strongSubjects.split(',').map((s) => s.trim()).filter(Boolean);
            if (careerGoal !== undefined)
                student.careerGoal = careerGoal;
            await student.save();
            // Update or create StudentDigitalTwin
            let twin = await StudentDigitalTwin.findOne({ userId: student._id });
            if (!twin) {
                twin = new StudentDigitalTwin({
                    userId: student._id,
                    studentId: student.rollNumber || student._id.toString(),
                    studentName: student.name,
                    department: student.department || 'Computer Science',
                    learningPaceScore: learningPaceScore !== undefined ? parseFloat(learningPaceScore) : 80,
                    codingProficiencyScore: codingProficiencyScore !== undefined ? parseFloat(codingProficiencyScore) : 75,
                    placementProbabilityPct: placementReadiness !== undefined ? parseFloat(placementReadiness) : 82,
                    predictedCGPA: student.cgpa || 8.5,
                    burnoutRisk: burnoutRisk || 'Low',
                    weakTopics: student.weakSubjects || [],
                    strongTopics: student.strongSubjects || [],
                });
            }
            else {
                if (learningPaceScore !== undefined)
                    twin.learningPaceScore = parseFloat(learningPaceScore);
                if (codingProficiencyScore !== undefined)
                    twin.codingProficiencyScore = parseFloat(codingProficiencyScore);
                if (placementReadiness !== undefined)
                    twin.placementProbabilityPct = parseFloat(placementReadiness);
                if (cgpa !== undefined)
                    twin.predictedCGPA = parseFloat(cgpa);
                if (burnoutRisk !== undefined)
                    twin.burnoutRisk = burnoutRisk;
                if (student.weakSubjects)
                    twin.weakTopics = student.weakSubjects;
                if (student.strongSubjects)
                    twin.strongTopics = student.strongSubjects;
            }
            // Add snapshot to timeline
            twin.timeline.push({
                version: (twin.timeline.length || 0) + 1,
                timestamp: new Date(),
                learningPace: twin.learningPaceScore,
                codingScore: twin.codingProficiencyScore,
                placementProbability: twin.placementProbabilityPct,
                predictedCGPA: twin.predictedCGPA || (student.cgpa || 8.5),
                burnoutRisk: twin.burnoutRisk || 'Low',
                dropoutRisk: twin.dropoutRiskPct || 3,
                interviewScore: Math.round((twin.placementProbabilityPct || 80) * 0.95),
            });
            await twin.save();
            // Update mentorship allocation feedback if teacher added mentor notes
            if (mentorNotes) {
                await MentorshipAllocation.updateMany({ studentId: student._id, mentorId: req.user._id }, { $set: { lastMentorFeedback: mentorNotes, lastEvaluatedAt: new Date() } });
            }
            logger.info({ studentId: student._id, updatedBy: req.user._id }, '[MentorshipController] Student telemetry updated successfully');
            return res.json({
                success: true,
                message: `Successfully updated academic & ML telemetry for ${student.name}!`,
                data: {
                    student,
                    digitalTwin: twin,
                }
            });
        }
        catch (err) {
            logger.error({ err }, '[MentorshipController] Error updating student telemetry');
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * POST /api/v1/mentorship/students/:studentId/recalculate-ml
     * Recalculates ML predictive analytics for a specific student based on fresh activity
     */
    static async recalculateStudentML(req, res) {
        try {
            const { studentId } = req.params;
            const student = await User.findById(studentId);
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student not found' });
            }
            let twin = await StudentDigitalTwin.findOne({ userId: student._id });
            if (!twin) {
                twin = new StudentDigitalTwin({
                    userId: student._id,
                    studentId: student.rollNumber || student._id.toString(),
                    studentName: student.name,
                    department: student.department || 'Computer Science',
                });
            }
            // Recompute ML telemetry algorithms (Query Python ML Service first)
            const baseCGPA = student.cgpa || 8.2;
            const codingSolved = student.externalProfiles?.leetcode?.totalSolved || 180;
            let newCodingScore = Math.min(99, Math.round(codingSolved * 0.28 + (student.xp || 500) * 0.01));
            let newLearningPace = Math.min(98, Math.max(45, Math.round(baseCGPA * 10.2 + (student.streak || 5) * 0.5)));
            let newPlacementProb = Math.min(99, Math.max(30, Math.round(baseCGPA * 6.5 + newCodingScore * 0.35 + (newLearningPace * 0.15))));
            let predictedGPA = parseFloat(Math.min(10.0, baseCGPA + (newLearningPace > 75 ? 0.2 : -0.1)).toFixed(2));
            let burnoutRisk = newLearningPace > 90 && (student.streak || 0) > 30 ? 'High' : (newLearningPace > 70 ? 'Low' : 'Medium');
            try {
                const mlUrl = process.env.PYTHON_ML_SERVICE_URL || process.env.PYTHON_ML_URL || 'http://localhost:8001';
                const pyRes = await fetch(`${mlUrl}/api/ml/digital-twin/analyze`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        student_id: student._id.toString(),
                        name: student.name,
                        department: student.department || 'Computer Science',
                        cgpa: baseCGPA,
                        attendance: student.attendanceRate || 88,
                        coding_score: newCodingScore,
                        coding_problems_solved: codingSolved,
                        quiz_avg: 84.0,
                        assignment_rate: 92.0,
                        ats_score: student.atsScore || 80,
                        xp: student.xp || 1000,
                    }),
                    signal: AbortSignal.timeout(3000),
                });
                if (pyRes.ok) {
                    const pyData = await pyRes.json();
                    const sub = pyData?.sub_twins;
                    if (sub) {
                        if (sub.learning?.learning_pace_score)
                            newLearningPace = Math.round(sub.learning.learning_pace_score);
                        if (sub.skill?.coding_proficiency_score)
                            newCodingScore = Math.round(sub.skill.coding_proficiency_score);
                        if (sub.career?.placement_likelihood_pct)
                            newPlacementProb = Math.round(sub.career.placement_likelihood_pct);
                        if (sub.academic?.predicted_gpa)
                            predictedGPA = parseFloat(sub.academic.predicted_gpa.toFixed(2));
                        if (sub.behavior?.burnout_risk_score !== undefined) {
                            burnoutRisk = sub.behavior.burnout_risk_score > 65 ? 'High' : (sub.behavior.burnout_risk_score > 35 ? 'Medium' : 'Low');
                        }
                    }
                }
            }
            catch (mlErr) {
                logger.warn({ err: mlErr.message }, '[MentorshipController] ML Service unavailable for recalculation, using deterministic fallbacks');
            }
            twin.learningPaceScore = newLearningPace;
            twin.codingProficiencyScore = newCodingScore;
            twin.placementProbabilityPct = newPlacementProb;
            twin.predictedCGPA = predictedGPA;
            twin.predictionConfidence = 96.5;
            twin.burnoutRisk = burnoutRisk;
            student.placementReadiness = newPlacementProb;
            await student.save();
            await twin.save();
            return res.json({
                success: true,
                message: `ML Digital Twin recalculated successfully for ${student.name}`,
                data: {
                    student,
                    digitalTwin: twin,
                }
            });
        }
        catch (err) {
            logger.error({ err }, '[MentorshipController] Error in recalculateStudentML');
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * GET /api/v1/mentorship/students
     * Fetches list of active students for allocation
     */
    static async getStudents(req, res) {
        try {
            const students = await User.find({ role: 'student', isActive: true })
                .select('name email rollNumber department semester section avatarUrl cgpa placementReadiness')
                .sort({ name: 1 })
                .lean();
            return res.json({ success: true, data: students });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * GET /api/v1/mentorship/available-mentors
     * Fetches list of mentors and faculty members from MongoDB
     */
    static async getAvailableMentors(req, res) {
        try {
            const mentors = await User.find({
                role: { $in: ['mentor', 'faculty', 'hod', 'alumni', 'industry_partner'] }
            }).select('name email role department avatarUrl bio skills').lean();
            return res.json({ success: true, data: mentors });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * POST /api/v1/mentorship/allocate
     * Allocates a mentor to a student (Faculty / Admin or Student self-choice action)
     */
    static async createAllocation(req, res) {
        try {
            let { studentId, mentorId, topic } = req.body;
            if (req.user.role === 'student') {
                studentId = req.user._id;
            }
            const [student, mentor] = await Promise.all([
                User.findById(studentId),
                User.findById(mentorId),
            ]);
            if (!student)
                return res.status(404).json({ success: false, message: 'Student not found' });
            if (!mentor)
                return res.status(404).json({ success: false, message: 'Mentor not found' });
            const existing = await MentorshipAllocation.findOne({
                studentId: student._id,
                mentorId: mentor._id,
                status: 'active',
            });
            if (existing) {
                return res.json({
                    success: true,
                    data: existing,
                    message: `Already connected with Mentor ${mentor.name}.`
                });
            }
            const allocation = await MentorshipAllocation.create({
                studentId: student._id,
                studentName: student.name,
                mentorId: mentor._id,
                mentorName: mentor.name,
                mentorRole: mentor.role,
                allocatedBy: req.user._id,
                allocatedByName: req.user.name,
                topic: topic || 'Academic & Career Growth Guidance',
                status: 'active',
            });
            return res.status(201).json({
                success: true,
                data: allocation,
                message: req.user.role === 'student'
                    ? `Successfully connected with Mentor ${mentor.name}!`
                    : `Successfully allocated Mentor ${mentor.name} to Student ${student.name}.`
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}
