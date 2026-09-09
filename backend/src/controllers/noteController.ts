import { Response } from 'express'
import SmartNote from '../models/SmartNote.js'

export class NoteController {
  /**
   * GET /api/v1/notes
   * Retrieves per-student smart notes from MongoDB
   */
  static async getNotes(req: any, res: Response) {
    try {
      const notes = await SmartNote.find({
        $or: [{ userId: req.user._id }, { isPublic: true }]
      }).sort({ updatedAt: -1 })

      return res.json({ success: true, data: notes })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }

  /**
   * POST /api/v1/notes
   * Creates a new smart note in MongoDB
   */
  static async createNote(req: any, res: Response) {
    try {
      const { title, content, tags, courseName, isPublic } = req.body
      if (!title || !content) return res.status(400).json({ success: false, message: 'Title and content are required' })

      const note = await SmartNote.create({
        userId: req.user._id,
        userName: req.user.name,
        title,
        content,
        tags: tags || ['General'],
        courseName: courseName || 'General Studies',
        isPublic: !!isPublic,
        aiSummary: `AI Summary: ${title} — ${content.slice(0, 100)}...`,
      })

      return res.status(201).json({ success: true, data: note, message: 'Note created successfully in MongoDB.' })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }
}
