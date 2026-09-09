import { JobApplication } from '../models/Recruitment.js';
import { PlacementDrive } from '../models/Recruitment.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import { logger } from '../config/logger.js';
export class RecruiterController {
    /**
     * Get all jobs created by this recruiter
     */
    static async getMyJobs(req, res) {
        try {
            const jobs = await Job.find({ postedBy: req.user._id })
                .sort({ createdAt: -1 })
                .lean();
            return res.json({ success: true, data: jobs });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * Get applications for a specific job with full student profiles
     */
    static async getJobApplications(req, res) {
        try {
            const { jobId } = req.params;
            const { status } = req.query;
            const filter = { jobId };
            if (status)
                filter.status = status;
            const applications = await JobApplication.find(filter)
                .populate('studentId', 'name email department semester cgpa skills rollNumber batch avatarUrl')
                .sort({ appliedAt: -1 })
                .lean();
            // Aggregate by status for pipeline view
            const pipeline = {
                APPLIED: 0, SCREENED: 0, SHORTLISTED: 0, INTERVIEW: 0,
                SELECTED: 0, OFFERED: 0, JOINED: 0, REJECTED: 0, WITHDRAWN: 0,
            };
            for (const app of applications) {
                pipeline[app.status]++;
            }
            return res.json({
                success: true,
                data: { applications, pipeline, total: applications.length },
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * Advance application through the hiring state machine
     */
    static async updateApplicationStatus(req, res) {
        try {
            const { applicationId } = req.params;
            const { status, note, interviewDate, offerAmount, offerDeadline } = req.body;
            // Validate status transition
            const validStatuses = ['APPLIED', 'SCREENED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'OFFERED', 'JOINED', 'REJECTED', 'WITHDRAWN'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
            }
            const application = await JobApplication.findById(applicationId);
            if (!application) {
                return res.status(404).json({ success: false, message: 'Application not found.' });
            }
            const oldStatus = application.status;
            application.status = status;
            application.statusHistory.push({
                status,
                changedAt: new Date(),
                changedBy: req.user._id,
                note: note || `Status changed from ${oldStatus} to ${status}`,
            });
            if (interviewDate)
                application.interviewDate = new Date(interviewDate);
            if (offerAmount)
                application.offerAmount = offerAmount;
            if (offerDeadline)
                application.offerDeadline = new Date(offerDeadline);
            await application.save();
            logger.info({ applicationId, oldStatus, newStatus: status }, '[RecruiterController] Application status updated');
            return res.json({ success: true, message: `Application moved to ${status}`, data: application });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * Search eligible students matching job criteria
     */
    static async searchEligibleStudents(req, res) {
        try {
            const { minCGPA, department, skills, batch, limit = 20 } = req.query;
            const filter = { role: 'student', isActive: true };
            if (minCGPA)
                filter.cgpa = { $gte: parseFloat(minCGPA) };
            if (department)
                filter.department = new RegExp(department, 'i');
            if (batch)
                filter.batch = batch;
            let students = await User.find(filter)
                .select('name email department semester cgpa skills batch rollNumber placementReadiness avatarUrl')
                .limit(parseInt(limit))
                .lean();
            // Post-filter by skills
            if (skills) {
                const requiredSkills = skills.split(',').map(s => s.trim().toLowerCase());
                students = students.filter(s => requiredSkills.some(rs => (s.skills || []).some(ss => ss.toLowerCase().includes(rs) || rs.includes(ss.toLowerCase()))));
            }
            return res.json({
                success: true,
                data: {
                    count: students.length,
                    criteria: { minCGPA, department, skills, batch },
                    students,
                },
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * Create a placement drive
     */
    static async createPlacementDrive(req, res) {
        try {
            const drive = await PlacementDrive.create({
                ...req.body,
                placementOfficerId: req.user._id,
            });
            return res.status(201).json({ success: true, data: drive });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * Get all placement drives
     */
    static async getPlacementDrives(req, res) {
        try {
            const { status } = req.query;
            const filter = {};
            if (status)
                filter.status = status;
            const drives = await PlacementDrive.find(filter)
                .sort({ driveDate: 1 })
                .lean();
            return res.json({ success: true, data: drives });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * Get hiring pipeline stats across all jobs for this recruiter
     */
    static async getPipelineStats(req, res) {
        try {
            const myJobs = await Job.find({ postedBy: req.user._id }).select('_id').lean();
            const jobIds = myJobs.map(j => j._id);
            const pipeline = await JobApplication.aggregate([
                { $match: { jobId: { $in: jobIds } } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]);
            const stats = {};
            for (const p of pipeline) {
                stats[p._id] = p.count;
            }
            return res.json({
                success: true,
                data: {
                    totalJobs: myJobs.length,
                    pipeline: stats,
                    totalApplications: Object.values(stats).reduce((a, b) => a + b, 0),
                },
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}
