import { Request, Response } from 'express'
import EventModel from '../models/Event.js'
import { RedisCache, CacheKeys, CacheTTL } from '../cache/RedisCache.js'

export class EventController {
  static async getAll(req: Request, res: Response) {
    try {
      const cached = await RedisCache.get<any>(CacheKeys.events())
      if (cached) return res.json({ success: true, data: cached, cached: true })

      const events = await EventModel.find({ isPublished: true })
        .sort({ date: 1 }).limit(50)
      await RedisCache.set(CacheKeys.events(), events, CacheTTL.events)
      return res.json({ success: true, data: events })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async create(req: any, res: Response) {
    try {
      const event = await EventModel.create({
        ...req.body,
        organizerId: req.user._id,
        organizerName: req.user.name,
      })
      await RedisCache.del(CacheKeys.events())
      return res.status(201).json({ success: true, data: event, message: 'Event created.' })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async rsvp(req: any, res: Response) {
    try {
      const event = await EventModel.findById(req.params.id)
      if (!event) return res.status(404).json({ success: false, message: 'Event not found' })

      const already = event.attendees.some(a => a.userId.toString() === req.user._id.toString())
      if (!already) {
        event.attendees.push({ userId: req.user._id, name: req.user.name, rsvpAt: new Date() })
        await event.save()
        await RedisCache.del(CacheKeys.events())
      }
      return res.json({ success: true, message: 'RSVP confirmed!', attendeeCount: event.attendees.length })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await EventModel.findByIdAndDelete(req.params.id)
      await RedisCache.del(CacheKeys.events())
      return res.json({ success: true, message: 'Event deleted.' })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }
}
