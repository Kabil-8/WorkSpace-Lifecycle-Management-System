import { Response } from 'express'
import { ContextBuilder } from '../ai/ContextBuilder.js'
import { PromptBuilder } from '../ai/PromptBuilder.js'
import { MemoryService } from '../ai/MemoryService.js'
import { GeminiService } from '../ai/GeminiService.js'
import { RAGEngine } from '../ai/RAGEngine.js'
import { PermissionLayer } from '../ai/PermissionLayer.js'
import { MultiAgentRouter } from '../ai/MultiAgentRouter.js'
import { PlanningEngine } from '../ai/PlanningEngine.js'
import { PredictiveAIService } from '../ai/PredictiveAIService.js'
import AuditLog from '../models/AuditLog.js'
import Gamification from '../models/Gamification.js'
import User from '../models/User.js'
import { logger } from '../config/logger.js'
import { DigitalTwinEngine } from '../ai/DigitalTwinEngine.js'
import { IntentClassifier } from '../ai/IntentClassifier.js'
import { OpenDomainAIEngine } from '../ai/OpenDomainAIEngine.js'

export class EdenController {
  /**
   * Non-Streaming Chat
   */
  static async chat(req: any, res: Response) {
    const startTime = Date.now()
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ success: false, error: '🔒 Authentication required. Please log in.' })
      }

      const { message, pageRoute, pageContextData } = req.body

      if (!message?.trim()) {
        return res.status(400).json({ success: false, error: 'Message cannot be empty' })
      }

      const cleanQuery = message.replace(/<\/?user_query>/g, '').trim()
      const user = req.user
      const uId = user._id.toString()
      const uName = user.name
      const uRole = user.role || 'student'

      const activeKey = (req.headers['x-gemini-key'] as string) || (req.headers['x-openai-key'] as string) || req.body.apiKey

      const resData = await OpenDomainAIEngine.resolveQuery(
        cleanQuery,
        {
          userId: uId,
          userName: uName,
          role: uRole,
          department: user.department,
          semester: user.semester,
        },
        {
          activeKey,
          provider: process.env.LLM_PROVIDER,
        },
      )

      if (resData.content) {
        await MemoryService.addMessage(uId, 'user', cleanQuery, uRole)
        await MemoryService.addMessage(uId, 'eden', resData.content, uRole)
      }

      const latencyMs = Date.now() - startTime

      AuditLog.create({
        action: 'EDEN_AI_CHAT',
        actorId: user._id,
        actorName: uName,
        actorRole: uRole,
        description: `EDEN AI [${resData.agentRole.toUpperCase()}] chat (${latencyMs}ms)`,
        severity: 'info',
        metadata: { pageRoute, agentRole: resData.agentRole, latencyMs },
      }).catch(() => {})

      return res.json({
        success: resData.success,
        intent: resData.intent,
        agentRole: resData.agentRole,
        content: resData.content,
        reply: resData.content,
        code: resData.code || null,
        language: resData.language || null,
        action: resData.action || null,
        target: resData.target || null,
        toolCalls: resData.toolCalls || [],
        conversationId: uId,
        metrics: { latencyMs },
      })
    } catch (err: any) {
      logger.error({ err: err.message }, '[EDEN] Chat controller error')
      return res.status(500).json({ success: false, error: err.message })
    }
  }

  /**
   * Streaming Chat with SSE Telemetry & Real-Time Reasoning Events
   */
  static async streamChat(req: any, res: Response) {
    const startTime = Date.now()

    if (!req.user || !req.user._id) {
      res.status(401).json({ success: false, error: '🔒 Authentication required. Please log in.' })
      return
    }

    const { message, pageRoute, pageContextData } = req.body

    if (!message?.trim()) {
      res.status(400).json({ success: false, error: 'Message cannot be empty' })
      return
    }

    const cleanQuery = message.replace(/<\/?user_query>/g, '').trim()
    const user = req.user
    const uId = user._id.toString()
    const uName = user.name
    const uRole = user.role || 'student'

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    }

    try {
      const activeKey = (req.headers['x-gemini-key'] as string) || (req.headers['x-openai-key'] as string) || req.body.apiKey

      const resData = await OpenDomainAIEngine.resolveQuery(
        cleanQuery,
        {
          userId: uId,
          userName: uName,
          role: uRole,
          department: user.department,
          semester: user.semester,
        },
        {
          activeKey,
          provider: process.env.LLM_PROVIDER,
        },
      )

      sendEvent('meta', {
        agentRole: resData.agentRole,
        intent: resData.intent,
        action: resData.action,
        target: resData.target,
      })

      // Stream output content in small natural chunks
      const words = (resData.content || '').split(' ')
      for (const word of words) {
        sendEvent('chunk', { text: word + ' ' })
        await new Promise(r => setTimeout(r, 10))
      }

      if (resData.content) {
        await MemoryService.addMessage(uId, 'user', cleanQuery, uRole)
        await MemoryService.addMessage(uId, 'eden', resData.content, uRole)
      }

      const latencyMs = Date.now() - startTime
      sendEvent('done', { success: true, metrics: { latencyMs } })
      res.end()

      AuditLog.create({
        action: 'EDEN_AI_STREAM',
        actorId: user._id,
        actorName: uName,
        actorRole: uRole,
        description: `EDEN AI stream (${latencyMs}ms)`,
        severity: 'info',
        metadata: { pageRoute, latencyMs },
      }).catch(() => {})
    } catch (err: any) {
      logger.error({ err: err.message }, '[EDEN] Stream controller error')
      sendEvent('error', { message: 'EDEN AI encountered an unexpected error.' })
      res.end()
    }
  }

  static async voice(req: any, res: Response) {
    req.body.message = req.body.transcript
    return EdenController.chat(req, res)
  }

  static async getMemory(req: any, res: Response) {
    try {
      const uId = req.user._id.toString()
      const uRole = req.user.role || 'student'
      const [history, longTerm, sessions] = await Promise.all([
        MemoryService.getHistory(uId, uRole),
        MemoryService.getLongTermMemories(uId),
        MemoryService.getSessions(uId),
      ])
      return res.json({ success: true, data: { history, longTermFacts: longTerm, sessions } })
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message })
    }
  }

  static async clearMemory(req: any, res: Response) {
    try {
      const uId = req.user._id.toString()
      const uRole = req.user.role || 'student'
      await MemoryService.clearHistory(uId, uRole)
      return res.json({ success: true, message: `EDEN memory cleared for ${uRole} session.` })
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message })
    }
  }

  static async recommend(req: any, res: Response) {
    try {
      const user = req.user
      const uId = user._id.toString()
      const uRole = user.role || 'student'

      const contextData = await ContextBuilder.buildContext(uId, user.name, uRole, 'recommendations', '/recommendations')
      const longTermMemories = await MemoryService.getLongTermMemories(uId)

      const systemPrompt = PromptBuilder.createPrompt(contextData, uRole, [], longTermMemories)
      const recommendationQuery = `Based on my profile, attendance, and goals, give 3 highly personalized actionable recommendations for this week. Return ONLY valid JSON array.`

      const resData = await GeminiService.chat(systemPrompt, recommendationQuery, [], uRole)

      try {
        const jsonMatch = resData.text?.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const recommendations = JSON.parse(jsonMatch[0])
          return res.json({ success: true, role: uRole, recommendations })
        }
      } catch {}

      return res.json({
        success: true,
        role: uRole,
        recommendations: [],
        rawResponse: resData.text,
      })
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message })
    }
  }

  static async digitalTwin(req: any, res: Response) {
    try {
      const uId = req.params?.userId || req.user?._id?.toString()
      if (!uId) return res.status(400).json({ success: false, error: 'User ID required' })
      const twin = await DigitalTwinEngine.getOrComputeTwin(uId)
      return res.json({
        success: true,
        data: twin,
      })
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message })
    }
  }

  static async uploadDocument(req: any, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' })
      }

      const { title, category = 'uploaded_document' } = req.body
      const user = req.user
      const fileContent = req.file.buffer.toString('utf-8').replace(/\0/g, ' ')
      const docTitle = title || req.file.originalname

      const doc = await RAGEngine.chunkAndEmbedDocument(
        docTitle,
        category,
        user.department || 'All Departments',
        fileContent,
        user._id,
      )

      logger.info({ docId: doc._id, title: docTitle, userId: user._id }, '[EDEN Vector RAG] Document ingested into knowledge base')

      return res.json({
        success: true,
        message: `Document "${docTitle}" has been ingested into EDEN Vector RAG with dense embeddings.`,
        documentId: doc._id,
        chunksCreated: doc.chunks.length,
      })
    } catch (err: any) {
      logger.error({ err: err.message }, '[EDEN] Vector document upload error')
      return res.status(500).json({ success: false, error: err.message })
    }
  }

  static async analyzeVision(req: any, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No image uploaded' })
      }

      const user = req.user
      const textPrompt = req.body.prompt || 'Analyze this image in detail.'
      const mimeType = req.file.mimetype || 'image/jpeg'
      const imageBase64 = req.file.buffer.toString('base64')

      const systemInstruction = `You are EDEN — the AI Operating System of EduSphere.
The user ${user.name} (${user.role}) has shared an image/document. Provide detailed, helpful analysis.`

      const result = await GeminiService.analyzeVision(imageBase64, mimeType, textPrompt, systemInstruction)

      if (result.success) {
        await MemoryService.addMessage(user._id.toString(), 'user', `[Vision Upload: ${req.file.originalname}] ${textPrompt}`, user.role)
        await MemoryService.addMessage(user._id.toString(), 'eden', result.text, user.role)
      }

      return res.json({
        success: result.success,
        analysis: result.text,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType,
      })
    } catch (err: any) {
      logger.error({ err: err.message }, '[EDEN] Vision analysis error')
      return res.status(500).json({ success: false, error: err.message })
    }
  }
}
