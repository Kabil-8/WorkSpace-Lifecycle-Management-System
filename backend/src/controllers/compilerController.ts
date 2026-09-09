import { Request, Response } from 'express'
import { CompilerEngine, ExecutionRequest } from '../services/compilerEngine.js'

export const runCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { language, code, input, timeoutMs } = req.body as ExecutionRequest

    if (!language || !code) {
      res.status(400).json({ success: false, message: 'Language and code are required fields' })
      return
    }

    const result = await CompilerEngine.execute({ language, code, input, timeoutMs })

    res.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to execute code',
      error: error.message,
    })
  }
}
