import { Router } from 'express';
import { getDashboard } from '../../controllers/dashboardController.js';
import { verifyToken } from '../../middleware/auth.js';
const router = Router();
router.get('/', verifyToken, getDashboard);
export default router;
