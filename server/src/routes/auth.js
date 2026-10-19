import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { requireStaffRole } from '../middleware/auth.js';

const router = Router();

// Staff Authentication Endpoints
router.post('/login', authController.login);
router.get('/me', requireStaffRole(['admin', 'dispatcher', 'field_crew']), authController.getMe);
router.post('/logout', authController.logout);

export default router;
