import { Router } from 'express';
import { incidentController } from '../controllers/incidentController.js';

const router = Router();

// Public Dashboard Stats
router.get('/', incidentController.getDashboardStats);

export default router;
