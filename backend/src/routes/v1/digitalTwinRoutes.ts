import { Router, Response } from 'express'
import { verifyToken } from '../../middleware/auth.js'
import { DigitalTwinEngine } from '../../ai/DigitalTwinEngine.js'
import { NaturalLanguageQueryEngine } from '../../ai/NaturalLanguageQueryEngine.js'
import { CognitiveLearningEngine } from '../../ai/CognitiveLearningEngine.js'

const router = Router()

/**
 * GET /api/v1/digital-twin/me
 * Retrieves current student's AI Digital Twin profile & predictions
 */
router.get('/me', verifyToken, async (req: any, res: Response) => {
  try {
    const twin = await DigitalTwinEngine.getOrComputeTwin(req.user._id.toString())
    return res.json({ success: true, data: twin })
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

/**
 * GET /api/v1/digital-twin/:userId
 * Retrieves specified student's AI Digital Twin profile
 */
router.get('/:userId', verifyToken, async (req: any, res: Response) => {
  try {
    const twin = await DigitalTwinEngine.getOrComputeTwin(req.params.userId)
    return res.json({ success: true, data: twin })
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

/**
 * POST /api/v1/digital-twin/update
 * Force recomputes current student's AI Digital Twin telemetry
 */
router.post('/update', verifyToken, async (req: any, res: Response) => {
  try {
    const twin = await DigitalTwinEngine.getOrComputeTwin(req.user._id.toString())
    return res.json({ success: true, data: twin, message: 'Digital Twin updated successfully' })
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

/**
 * POST /api/v1/digital-twin/retrain
 * Triggers retraining of all 8 Python Scikit-Learn/XGBoost ML twin models
 */
router.post('/retrain', verifyToken, async (_req: any, res: Response) => {
  try {
    const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8001'
    const response = await fetch(`${mlUrl}/api/ml/digital-twin/retrain`, { method: 'POST' })
    if (!response.ok) {
      throw new Error(`ML service returned status ${response.status}`)
    }
    const data = await response.json()
    return res.json({ success: true, data })
  } catch (err: any) {
    return res.status(500).json({ success: false, message: `Retraining failed: ${err.message}` })
  }
})

/**
 * POST /api/v1/ai/nl-query
 * Executes natural language database query
 */
router.post('/nl-query', verifyToken, async (req: any, res: Response) => {
  try {
    const { query } = req.body
    if (!query) return res.status(400).json({ success: false, message: 'Query string is required' })

    const result = await NaturalLanguageQueryEngine.processQuery(query, {
      userId: req.user._id,
      userName: req.user.name,
      role: req.user.role,
    })

    return res.json({ success: true, data: result })
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

/**
 * POST /api/v1/ai/cognitive-recall
 * Evaluates active recall SM-2 repetition
 */
router.post('/cognitive-recall', verifyToken, async (req: any, res: Response) => {
  try {
    const { topic, rating } = req.body
    const result = await CognitiveLearningEngine.evaluateRecallPerformance(
      req.user._id.toString(),
      topic || 'Core Concept',
      rating ?? 4
    )
    return res.json({ success: true, data: result })
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

export default router
