import { Response } from 'express'
import { JobApplication, ApplicationStatus } from '../models/Recruitment.js'
import { PlacementDrive } from '../models/Recruitment.js'
import Job from '../models/Job.js'
import User from '../models/User.js'
import { eventBus, Events } from '../events/eventBus.js'
import { logger } from '../config/logger.js'

export class RecruiterController {
  /**
   * Get all jobs created by this recruiter
   */
  static async getMyJobs(req: any, res: Response) {
    try {
      const jobs = await Job.find({ postedBy: req.user._id })
        .sort({ createdAt: -1 })
        .lean()
      return res.json({ success: true, data: jobs })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  /**
   * Get applications for a specific job with full student profiles
   */
  static async getJobApplications(req: any, res: Response) {
    try {
      const { jobId } = req.params
      const { status } = req.query

      const filter: any = { jobId }
      if (status) filter.status = status

      const applications = await JobApplication.find(filter)
        .populate('studentId', 'name email department semester cgpa skills rollNumber batch avatarUrl')
        .sort({ appliedAt: -1 })
        .lean()

      // Aggregate by status for pipeline view
      const pipeline: Record<ApplicationStatus, number> = {
        APPLIED: 0, SCREENED: 0, SHORTLISTED: 0, INTERVIEW: 0,
        SELECTED: 0, OFFERED: 0, JOINED: 0, REJECTED: 0, WITHDRAWN: 0,
      }
      for (const app of applications) {
        pipeline[app.status as ApplicationStatus]++
      }

      return res.json({
        success: true,
        data: { applications, pipeline, total: applications.length },
      })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  /**
   * Advance application through the hiring state machine
   */
  static async updateApplicationStatus(req: any, res: Response) {
    try {
      const { applicationId } = req.params
      const { status, note, interviewDate, offerAmount, offerDeadline } = req.body

      // Validate status transition
      const validStatuses: ApplicationStatus[] = ['APPLIED', 'SCREENED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'OFFERED', 'JOINED', 'REJECTED', 'WITHDRAWN']
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: `Invalid status: ${status}` })
      }

      const application = await JobApplication.findById(applicationId)
      if (!application) {
        return res.status(404).json({ success: false, message: 'Application not found.' })
      }

      const oldStatus = application.status
      application.status = status
      application.statusHistory.push({
        status,
        changedAt: new Date(),
        changedBy: req.user._id,
        note: note || `Status changed from ${oldStatus} to ${status}`,
      })

      if (interviewDate) application.interviewDate = new Date(interviewDate)
      if (offerAmount) application.offerAmount = offerAmount
      if (offerDeadline) application.offerDeadline = new Date(offerDeadline)

      await application.save()

      logger.info({ applicationId, oldStatus, newStatus: status }, '[RecruiterController] Application status updated')

      return res.json({ success: true, message: `Application moved to ${status}`, data: application })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  /**
   * Search eligible students matching job criteria
   */
  static async searchEligibleStudents(req: any, res: Response) {
    try {
      const { minCGPA, department, skills, batch, limit = 20 } = req.query

      const filter: any = { role: 'student', isActive: true }
      if (minCGPA) filter.cgpa = { $gte: parseFloat(minCGPA as string) }
      if (department) filter.department = new RegExp(department as string, 'i')
      if (batch) filter.batch = batch

      let students = await User.find(filter)
        .select('name email department semester cgpa skills batch rollNumber placementReadiness avatarUrl')
        .limit(parseInt(limit as string))
        .lean()

      // Post-filter by skills
      if (skills) {
        const requiredSkills = (skills as string).split(',').map(s => s.trim().toLowerCase())
        students = students.filter(s =>
          requiredSkills.some(rs =>
            (s.skills || []).some(ss => ss.toLowerCase().includes(rs) || rs.includes(ss.toLowerCase()))
          )
        )
      }

      return res.json({
        success: true,
        data: {
          count: students.length,
          criteria: { minCGPA, department, skills, batch },
          students,
        },
      })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  /**
   * Create a placement drive
   */
  static async createPlacementDrive(req: any, res: Response) {
    try {
      const drive = await PlacementDrive.create({
        ...req.body,
        placementOfficerId: req.user._id,
      })
      return res.status(201).json({ success: true, data: drive })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  /**
   * Get all placement drives
   */
  static async getPlacementDrives(req: any, res: Response) {
    try {
      const { status } = req.query
      const filter: any = {}
      if (status) filter.status = status

      const drives = await PlacementDrive.find(filter)
        .sort({ driveDate: 1 })
        .lean()

      return res.json({ success: true, data: drives })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  /**
   * Get hiring pipeline stats across all jobs for this recruiter
   */
  static async getPipelineStats(req: any, res: Response) {
    try {
      const myJobs = await Job.find({ postedBy: req.user._id }).select('_id').lean()
      const jobIds = myJobs.map(j => j._id)

      const pipeline = await JobApplication.aggregate([
        { $match: { jobId: { $in: jobIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ])

      const stats: Record<string, number> = {}
      for (const p of pipeline) {
        stats[p._id] = p.count
      }

      return res.json({
        success: true,
        data: {
          totalJobs: myJobs.length,
          pipeline: stats,
          totalApplications: Object.values(stats).reduce((a, b) => a + b, 0),
        },
      })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }
}
