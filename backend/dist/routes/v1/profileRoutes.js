import { Router } from 'express';
import { verifyToken } from '../../middleware/auth.js';
import { getCodingStats, syncExternalProfiles, getCodingLeaderboard, syncAtsToProfile } from '../../controllers/profileController.js';
const router = Router();
router.get('/coding-stats', verifyToken, getCodingStats);
router.post('/sync-external', verifyToken, syncExternalProfiles);
router.get('/leaderboard', verifyToken, getCodingLeaderboard);
router.put('/sync-ats', verifyToken, syncAtsToProfile);
export default router;
