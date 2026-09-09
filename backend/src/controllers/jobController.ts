import { Request, Response } from 'express'
import Job from '../models/Job.js'
import Notification from '../models/Notification.js'
import { RedisCache, CacheKeys, CacheTTL } from '../cache/RedisCache.js'

export class JobController {
  static async getAll(req: Request, res: Response) {
    try {
      const { type, domain, search, location, page = '1', limit = '20' } = req.query as any
      const filters: any = { isActive: true }
      if (type) filters.type = type
      if (domain) filters.domain = domain
      if (location) filters.location = { $regex: location, $options: 'i' }
      if (search) filters.$text = { $search: search }

      const cacheKey = CacheKeys.jobs(JSON.stringify({ type, domain, search, location, page }))
      const cached = await RedisCache.get<any>(cacheKey)
      if (cached) return res.json({ success: true, ...cached, cached: true })

      const skip = (parseInt(page) - 1) * parseInt(limit)
      const [jobs, total] = await Promise.all([
        Job.find(filters).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
        Job.countDocuments(filters),
      ])

      const result = { data: jobs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
      await RedisCache.set(cacheKey, result, CacheTTL.jobs)
      return res.json({ success: true, ...result })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async create(req: any, res: Response) {
    try {
      const job = await Job.create({
        ...req.body,
        postedById: req.user._id,
        postedByName: req.user.name,
      })
      await RedisCache.flush('jobs:*')
      return res.status(201).json({ success: true, data: job, message: 'Job posted successfully.' })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async apply(req: any, res: Response) {
    try {
      const job = await Job.findById(req.params.id)
      if (!job) return res.status(404).json({ success: false, message: 'Job not found' })

      const alreadyApplied = job.applicants.some(a => a.userId.toString() === req.user._id.toString())
      if (alreadyApplied) {
        return res.status(409).json({ success: false, message: 'Already applied to this job.' })
      }

      job.applicants.push({ userId: req.user._id, appliedAt: new Date(), status: 'applied' })
      await job.save()

      await Notification.create({
        userId: job.postedById,
        title: 'New Job Application',
        message: `${req.user.name} applied for ${job.title} at ${job.company}`,
        type: 'placement',
        priority: 'medium',
      })

      await RedisCache.flush('jobs:*')
      return res.json({ success: true, message: 'Applied successfully!' })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await Job.findByIdAndDelete(req.params.id)
      await RedisCache.flush('jobs:*')
      return res.json({ success: true, message: 'Job deleted.' })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }
}
