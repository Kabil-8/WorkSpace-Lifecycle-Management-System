import { Request, Response } from 'express'
import { Exam } from '../models/proctor/Exam.js'
import { StudentAttempt } from '../models/proctor/StudentAttempt.js'
import { ProctorLog } from '../models/proctor/ProctorLog.js'
import { ExamAnalytics } from '../models/proctor/ExamAnalytics.js'

export class ProctorController {
  // ── Exam CRUD (Faculty & Admin Only) ──────────────────────────────────
  static async getExams(req: Request, res: Response) {
    try {
      const exams = await Exam.find().sort({ createdAt: -1 })
      return res.json({ success: true, data: exams })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async getExamById(req: Request, res: Response) {
    try {
      const exam = await Exam.findById(req.params.id)
      if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' })
      return res.json({ success: true, data: exam })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async createExam(req: Request, res: Response) {
    try {
      const { title, subject, department, description, durationMinutes, passingScore, questions, proctorConfig } = req.body
      const newExam = await Exam.create({
        title: title || 'Intelligent Proctored Assessment',
        subject: subject || 'Computer Science',
        department: department || 'Computer Science',
        description: description || '',
        durationMinutes: durationMinutes || 60,
        passingScore: passingScore || 70,
        totalPoints: (questions || []).reduce((acc: number, q: any) => acc + (q.points || 5), 0) || 100,
        createdByName: (req as any).user?.name || 'Faculty Instructor',
        createdBy: (req as any).user?._id,
        proctorConfig: proctorConfig || {},
        questions: questions || [
          { id: 'q1', text: 'Explain the difference between TCP and UDP protocols in computer networks.', type: 'short_answer', correctAnswer: 'TCP is connection-oriented, UDP is connectionless.', points: 10 },
          { id: 'q2', text: 'Which data structure is used for Breadth-First Search (BFS)?', type: 'multiple_choice', options: ['Stack', 'Queue', 'Array', 'Heap'], correctAnswer: 'Queue', points: 10 },
          { id: 'q3', text: 'Time complexity of Binary Search in a sorted array is O(log n).', type: 'true_false', options: ['True', 'False'], correctAnswer: 'True', points: 10 }
        ]
      })
      const io = req.app.get('io')
      if (io) {
        io.emit('exam:created', newExam)
      }
      return res.status(201).json({ success: true, data: newExam, message: 'Proctored exam created successfully.' })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async updateExam(req: Request, res: Response) {
    try {
      const updatedExam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true })
      if (!updatedExam) return res.status(404).json({ success: false, message: 'Exam not found' })
      const io = req.app.get('io')
      if (io) {
        io.emit('exam:updated', updatedExam)
      }
      return res.json({ success: true, data: updatedExam, message: 'Exam updated successfully.' })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async deleteExam(req: Request, res: Response) {
    try {
      const deletedExam = await Exam.findByIdAndDelete(req.params.id)
      if (!deletedExam) return res.status(404).json({ success: false, message: 'Exam not found' })
      const io = req.app.get('io')
      if (io) {
        io.emit('exam:deleted', req.params.id)
      }
      return res.json({ success: true, message: 'Exam deleted successfully.' })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  // ── Student Exam Workflow APIs ───────────────────────────────────────
  static async startExam(req: Request, res: Response) {
    try {
      const { examId, studentId, studentName, studentEmail } = req.body
      const exam = await Exam.findById(examId)
      if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' })

      // Create Attempt
      const attempt = await StudentAttempt.create({
        examId,
        studentId: studentId || (req as any).user?._id || '650000000000000000000001',
        studentName: studentName || (req as any).user?.name || 'Student Candidate',
        studentEmail: studentEmail || (req as any).user?.email || 'student@edusphere.edu',
        status: 'in_progress',
        totalQuestions: exam.questions.length,
        integrityScore: 100,
        riskCategory: 'Safe',
      })

      // Initialize Proctor Log
      await ProctorLog.create({
        attemptId: attempt._id,
        studentId: attempt.studentId,
        examId: attempt.examId,
        eyeTrackingLogs: [],
        headMovementLogs: [],
        browserEvents: [],
        warningLogs: [],
        integrityHistory: [{ timestamp: new Date().toLocaleTimeString(), score: 100 }]
      })

      return res.status(201).json({ success: true, data: { attempt, exam } })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async verifyFace(req: Request, res: Response) {
    try {
      const { attemptId, faceSnapshot } = req.body
      const attempt = await StudentAttempt.findById(attemptId)
      if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' })

      // Simulated facial verification match ratio
      const isMatch = Boolean(faceSnapshot && faceSnapshot.length > 50)
      return res.json({
        success: isMatch,
        confidence: isMatch ? 0.96 : 0.42,
        message: isMatch ? 'Identity Verified Successfully' : 'Facial Verification Failed'
      })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async logEyeTracking(req: Request, res: Response) {
    try {
      const { attemptId, gazeDirection, irisRatio, eyeFocusScore } = req.body
      await ProctorLog.findOneAndUpdate(
        { attemptId },
        {
          $push: {
            eyeTrackingLogs: {
              timestamp: new Date().toLocaleTimeString(),
              gazeDirection: gazeDirection || 'Center',
              irisRatio: irisRatio || 0.5,
              eyeFocusScore: eyeFocusScore || 95
            }
          }
        }
      )
      return res.json({ success: true })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async logHeadPose(req: Request, res: Response) {
    try {
      const { attemptId, orientation, pitch, yaw, roll } = req.body
      await ProctorLog.findOneAndUpdate(
        { attemptId },
        {
          $push: {
            headMovementLogs: {
              timestamp: new Date().toLocaleTimeString(),
              orientation: orientation || 'Forward',
              pitch: pitch || 0,
              yaw: yaw || 0,
              roll: roll || 0
            }
          }
        }
      )
      return res.json({ success: true })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async logBrowserEvents(req: Request, res: Response) {
    try {
      const { attemptId, eventType, details, severity } = req.body
      await ProctorLog.findOneAndUpdate(
        { attemptId },
        {
          $push: {
            browserEvents: {
              timestamp: new Date().toLocaleTimeString(),
              eventType: eventType || 'tab_switch',
              details: details || 'User switched browser tab',
              severity: severity || 'medium'
            }
          }
        }
      )
      await StudentAttempt.findByIdAndUpdate(attemptId, { $inc: { browserViolationsCount: 1 } })
      return res.json({ success: true })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async issueWarning(req: Request, res: Response) {
    try {
      const { attemptId, type, message } = req.body
      const attempt = await StudentAttempt.findById(attemptId)
      if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' })

      const newWarningCount = attempt.warningsCount + 1
      const scoreDeduction = newWarningCount * 12
      const newIntegrityScore = Math.max(0, 100 - scoreDeduction)

      let riskCategory: 'Safe' | 'Low Risk' | 'Moderate Risk' | 'Suspicious' | 'High Risk' = 'Safe'
      if (newIntegrityScore <= 20) riskCategory = 'High Risk'
      else if (newIntegrityScore <= 40) riskCategory = 'Suspicious'
      else if (newIntegrityScore <= 60) riskCategory = 'Moderate Risk'
      else if (newIntegrityScore <= 80) riskCategory = 'Low Risk'

      attempt.warningsCount = newWarningCount
      attempt.integrityScore = newIntegrityScore
      attempt.riskCategory = riskCategory
      if (newWarningCount >= 4) {
        attempt.status = 'under_review'
      }
      await attempt.save()

      await ProctorLog.findOneAndUpdate(
        { attemptId },
        {
          $push: {
            warningLogs: {
              timestamp: new Date().toLocaleTimeString(),
              warningNumber: newWarningCount,
              type: type || 'Looking Away',
              message: message || 'Proctor Warning Issued'
            },
            integrityHistory: {
              timestamp: new Date().toLocaleTimeString(),
              score: newIntegrityScore
            }
          }
        }
      )

      const io = req.app.get('io')
      if (io) {
        io.to(`proctor:${attempt.examId}`).emit('student-warning', {
          examId: attempt.examId,
          studentId: attempt.studentId,
          studentName: attempt.studentName,
          warningType: type || 'Proctor Warning',
          message: message || 'Proctor warning issued',
          warningNumber: newWarningCount,
        })
        io.to(`proctor:${attempt.examId}`).emit('risk-score-update', {
          examId: attempt.examId,
          studentId: attempt.studentId,
          studentName: attempt.studentName,
          integrityScore: newIntegrityScore,
          riskCategory,
          warningsCount: newWarningCount,
        })
      }

      return res.json({
        success: true,
        warningsCount: newWarningCount,
        integrityScore: newIntegrityScore,
        riskCategory,
        message: `Warning #${newWarningCount} issued to student.`
      })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async submitExam(req: Request, res: Response) {
    try {
      const { attemptId, answers } = req.body
      const attempt = await StudentAttempt.findById(attemptId)
      if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' })

      const exam = await Exam.findById(attempt.examId)
      let correctCount = 0
      let totalEarnedScore = 0

      if (exam && answers) {
        exam.questions.forEach((q) => {
          const studentAns = answers[q.id]
          if (!studentAns || typeof studentAns !== 'string') return

          if (q.type === 'coding') {
            const hasSubmittedCode = studentAns.trim().length > 15
            if (hasSubmittedCode) {
              correctCount += 1
              totalEarnedScore += q.points
            }
          } else if (q.correctAnswer && studentAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
            correctCount += 1
            totalEarnedScore += q.points
          }
        })
      }

      attempt.answers = answers || {}
      attempt.score = totalEarnedScore
      attempt.correctAnswersCount = correctCount
      attempt.endTime = new Date()
      attempt.status = attempt.warningsCount >= 4 ? 'under_review' : 'completed'
      await attempt.save()

      const io = req.app.get('io')
      if (io) {
        io.emit('exam:submitted', {
          attemptId: attempt._id,
          examId: attempt.examId,
          studentId: attempt.studentId,
          studentName: attempt.studentName,
          score: totalEarnedScore,
          integrityScore: attempt.integrityScore,
        })
        io.emit('analytics:updated', { timestamp: new Date().toISOString() })
      }

      return res.json({
        success: true,
        data: attempt,
        message: 'Exam submitted successfully and AI integrity report generated.'
      })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async getIntegrityReport(req: Request, res: Response) {
    try {
      const { attemptId } = req.params
      const attempt = await StudentAttempt.findById(attemptId).populate('examId')
      if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' })

      const log = await ProctorLog.findOne({ attemptId })

      return res.json({
        success: true,
        data: {
          attempt,
          log: log || { eyeTrackingLogs: [], headMovementLogs: [], browserEvents: [], warningLogs: [], integrityHistory: [] }
        }
      })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async getFacultyLiveMonitor(req: Request, res: Response) {
    try {
      const { examId } = req.params
      const query = (!examId || examId === 'all') ? { status: 'in_progress' } : { examId, status: 'in_progress' }
      const activeAttempts = await StudentAttempt.find(query).sort({ updatedAt: -1 })
      return res.json({ success: true, data: activeAttempts })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async getFacultyAnalytics(req: Request, res: Response) {
    try {
      const examId = (req.query.examId || req.params.examId) as string
      if (examId && examId !== 'all') {
        const attempts = await StudentAttempt.find({ examId })
        const total = attempts.length
        const avgScore = total > 0 ? (attempts.reduce((sum, a) => sum + (a.integrityScore || 100), 0) / total) : 100

        const safeCount = attempts.filter(a => a.integrityScore >= 81).length
        const lowRiskCount = attempts.filter(a => a.integrityScore >= 61 && a.integrityScore <= 80).length
        const moderateRiskCount = attempts.filter(a => a.integrityScore >= 41 && a.integrityScore <= 60).length
        const suspiciousCount = attempts.filter(a => a.integrityScore >= 21 && a.integrityScore <= 40).length
        const highRiskCount = attempts.filter(a => a.integrityScore <= 20).length

        const lookingAwayCount = attempts.reduce((sum, a) => sum + (a.eyeFocusPercentage < 80 ? 1 : 0), 0) * 3
        const tabSwitchCount = attempts.reduce((sum, a) => sum + (a.browserViolationsCount || 0), 0)
        const faceMissingCount = attempts.reduce((sum, a) => sum + (a.facePresencePercentage < 80 ? 1 : 0), 0) * 2
        const warningsCount = attempts.reduce((sum, a) => sum + (a.warningsCount || 0), 0)

        return res.json({
          success: true,
          data: {
            examId,
            department: 'Computer Science & Engineering',
            totalExamsConducted: 1,
            totalStudentsAssessed: total,
            averageIntegrityScore: Number(avgScore.toFixed(1)),
            highRiskFlaggedCount: highRiskCount,
            riskDistribution: [
              { name: 'Safe (81-100)', count: safeCount },
              { name: 'Low Risk (61-80)', count: lowRiskCount },
              { name: 'Moderate (41-60)', count: moderateRiskCount },
              { name: 'Suspicious (21-40)', count: suspiciousCount },
              { name: 'High Risk (0-20)', count: highRiskCount },
            ],
            topViolations: [
              { violationType: 'Looking Away from Screen', count: lookingAwayCount },
              { violationType: 'Tab Switch / Window Blur', count: tabSwitchCount },
              { violationType: 'Face Missing from Frame', count: faceMissingCount },
              { violationType: 'Faculty Proctor Manual Warnings', count: warningsCount },
            ]
          }
        })
      }

      let analytics = await ExamAnalytics.findOne()
      if (!analytics) {
        analytics = await ExamAnalytics.create({
          department: 'Computer Science & Engineering',
          totalExamsConducted: 14,
          totalStudentsAssessed: 520,
          averageIntegrityScore: 91.2,
          safeCount: 425,
          lowRiskCount: 60,
          moderateRiskCount: 22,
          suspiciousCount: 9,
          highRiskCount: 4,
          topViolations: [
            { violationType: 'Looking Away from Screen', count: 142 },
            { violationType: 'Tab Switch / Window Blur', count: 88 },
            { violationType: 'Face Missing', count: 45 },
            { violationType: 'Multiple Faces Detected', count: 12 },
          ],
          monthlyStats: [
            { month: 'Feb', avgIntegrity: 88.5, totalExams: 8 },
            { month: 'Mar', avgIntegrity: 90.1, totalExams: 10 },
            { month: 'Apr', avgIntegrity: 89.2, totalExams: 12 },
            { month: 'May', avgIntegrity: 92.4, totalExams: 14 },
          ]
        })
      }
      return res.json({
        success: true,
        data: {
          ...analytics.toObject(),
          riskDistribution: [
            { name: 'Safe (81-100)', count: analytics.safeCount || 425 },
            { name: 'Low Risk (61-80)', count: analytics.lowRiskCount || 60 },
            { name: 'Moderate (41-60)', count: analytics.moderateRiskCount || 22 },
            { name: 'Suspicious (21-40)', count: analytics.suspiciousCount || 9 },
            { name: 'High Risk (0-20)', count: analytics.highRiskCount || 4 },
          ]
        }
      })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }
}
