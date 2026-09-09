import { Router } from 'express'
import { runCode } from '../controllers/compilerController.js'

const router = Router()

router.post('/run', runCode)

export default router
