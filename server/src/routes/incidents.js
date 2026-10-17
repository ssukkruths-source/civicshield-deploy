import { Router } from 'express';
import { incidentController } from '../controllers/incidentController.js';
import { validateIncidentCreation } from '../middleware/validate.js';
import { reportRateLimiter } from '../middleware/rateLimit.js';
import { requireStaffRole } from '../middleware/auth.js';

const router = Router();

// Public Citizen Endpoints
router.get('/', incidentController.getIncidents);
router.get('/reference/:referenceId', incidentController.getIncidentByReference);
router.get('/:id', incidentController.getIncidentById);
router.post('/', reportRateLimiter, validateIncidentCreation, incidentController.createIncident);

// Protected Staff & Crew Endpoints
router.patch('/:id/status', requireStaffRole(['admin', 'dispatcher', 'field_crew']), incidentController.updateStatus);
router.patch('/:id/assign', requireStaffRole(['admin', 'dispatcher']), incidentController.assignCrew);
router.post('/:id/verification', requireStaffRole(['admin', 'dispatcher', 'field_crew']), incidentController.recordVerification);
router.post('/:id/resolution', requireStaffRole(['admin', 'dispatcher', 'field_crew']), incidentController.recordResolution);

export default router;
