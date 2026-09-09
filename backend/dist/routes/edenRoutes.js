import { Router } from 'express';
import multer from 'multer';
import { EdenController } from '../controllers/edenController.js';
import { verifyToken } from '../middleware/auth.js';
import { edenRateLimiter, edenPromptSanitizer } from '../middleware/edenSecurity.js';
const router = Router();
// Multer for RAG document ingestion
const docUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['application/pdf', 'text/plain', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/markdown', 'text/x-markdown'];
        if (allowed.includes(file.mimetype) || /\.(pdf|txt|docx|doc|md)$/i.test(file.originalname)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only PDF, TXT, DOCX, and MD files allowed for RAG'));
        }
    },
});
// Multer for Vision analysis
const visionUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif',
            'image/heic', 'image/bmp', 'application/pdf'];
        if (allowed.includes(file.mimetype) || /\.(jpg|jpeg|png|webp|gif|pdf|bmp|heic)$/i.test(file.originalname)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only images (JPEG, PNG, WebP, GIF) and PDFs are supported for Vision analysis'));
        }
    },
});
// EDEN AI Routes
router.post('/chat', verifyToken, edenRateLimiter, edenPromptSanitizer, EdenController.chat);
router.post('/stream', verifyToken, edenRateLimiter, edenPromptSanitizer, EdenController.streamChat);
router.post('/voice', verifyToken, edenRateLimiter, EdenController.voice);
// Intelligence & Digital Twin
router.post('/recommend', verifyToken, EdenController.recommend);
router.get('/recommend', verifyToken, EdenController.recommend);
router.get('/digital-twin', verifyToken, EdenController.digitalTwin);
router.post('/digital-twin', verifyToken, EdenController.digitalTwin);
router.get('/proactive-intervention', verifyToken, EdenController.getProactiveIntervention);
router.post('/proactive-intervention', verifyToken, EdenController.getProactiveIntervention);
router.post('/telemetry', verifyToken, EdenController.recordTelemetry);
router.post('/intervention/complete', verifyToken, EdenController.completeIntervention);
// Memory & Sessions
router.get('/memory', verifyToken, EdenController.getMemory);
router.delete('/memory', verifyToken, EdenController.clearMemory);
// Upload & Vision
router.post('/upload-document', verifyToken, docUpload.single('file'), EdenController.uploadDocument);
router.post('/analyze-vision', verifyToken, visionUpload.single('file'), EdenController.analyzeVision);
export default router;
