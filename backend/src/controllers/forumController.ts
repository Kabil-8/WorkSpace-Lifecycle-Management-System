import { Request, Response } from 'express'
import ForumPost from '../models/ForumPost.js'
import User from '../models/User.js'
import Gamification from '../models/Gamification.js'
import { RedisCache, CacheKeys, CacheTTL } from '../cache/RedisCache.js'
import { eventBus, Events } from '../events/eventBus.js'

export class ForumController {
  static async getPosts(req: Request, res: Response) {
    try {
      const { category, search, page = '1', limit = '20', department } = req.query as any
      const filters: any = {}
      if (category) filters.category = category
      if (department) filters.department = department
      if (search) filters.$text = { $search: search }

      const cacheKey = CacheKeys.forumPosts(parseInt(page))
      if (!search && !category) {
        const cached = await RedisCache.get<any>(cacheKey)
        if (cached) return res.json({ success: true, ...cached, cached: true })
      }

      const skip = (parseInt(page) - 1) * parseInt(limit)
      const [posts, total] = await Promise.all([
        ForumPost.find(filters)
          .sort({ isPinned: -1, createdAt: -1 })
          .skip(skip).limit(parseInt(limit)),
        ForumPost.countDocuments(filters),
      ])

      const result = { data: posts, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
      if (!search && !category) await RedisCache.set(cacheKey, result, CacheTTL.forumPosts)
      return res.json({ success: true, ...result })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async create(req: any, res: Response) {
    try {
      const post = await ForumPost.create({
        ...req.body,
        authorId: req.user._id,
        authorName: req.user.name,
        authorRole: req.user.role,
        authorDepartment: req.user.department,
      })
      await RedisCache.flush('forum:posts:*')
      eventBus.emit(Events.FORUM_POST_CREATED, { postId: post._id, authorId: req.user._id })

      // Award +25 XP to student for forum post
      try {
        await User.findByIdAndUpdate(req.user._id, { $inc: { xp: 25 } })
        let gami = await Gamification.findOne({ userId: req.user._id })
        if (gami) {
          gami.xp += 25
          await gami.save()
        } else {
          await Gamification.create({ userId: req.user._id, xp: 25, level: 1, streak: 1 })
        }
      } catch {
        // Non-critical XP update error
      }

      return res.status(201).json({ success: true, data: post, message: 'Post created & +25 XP awarded!' })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async reply(req: any, res: Response) {
    try {
      const post = await ForumPost.findById(req.params.id)
      if (!post) return res.status(404).json({ success: false, message: 'Post not found' })

      post.replies.push({
        authorId: req.user._id,
        authorName: req.user.name,
        authorRole: req.user.role,
        content: req.body.content,
        likes: [],
        createdAt: new Date(),
      })
      await post.save()
      await RedisCache.flush('forum:posts:*')

      // Award +15 XP for replying to discussion
      try {
        await User.findByIdAndUpdate(req.user._id, { $inc: { xp: 15 } })
        let gami = await Gamification.findOne({ userId: req.user._id })
        if (gami) {
          gami.xp += 15
          await gami.save()
        }
      } catch {
        // Non-critical
      }

      return res.json({ success: true, message: 'Reply posted & +15 XP awarded!' })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async like(req: any, res: Response) {
    try {
      const post = await ForumPost.findById(req.params.id)
      if (!post) return res.status(404).json({ success: false, message: 'Post not found' })

      const idx = post.likes.findIndex(id => id.toString() === req.user._id.toString())
      if (idx > -1) post.likes.splice(idx, 1)
      else post.likes.push(req.user._id)
      await post.save()
      return res.json({ success: true, likes: post.likes.length })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async incrementViews(req: Request, res: Response) {
    try {
      await ForumPost.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } })
      return res.json({ success: true })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }
}
