import { Router } from 'express';
import { incidentController } from '../controllers/incidentController.js';

const router = Router();

// Staff Directory (Used for Dispatcher assignment dropdowns)
router.get('/', incidentController.getStaffDirectory);

export default router;
