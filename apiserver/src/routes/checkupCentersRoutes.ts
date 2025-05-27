import express from 'express';
import {
  getCheckupCenters,
  getCheckupCenterById,
  createCheckupCenter,
  updateCheckupCenter,
  deleteCheckupCenter,
  assignPatientToCheckupCenter,
  removePatientFromCheckupCenter,
  updatePatientNextVisit
} from '../controllers/checkupCenters';
import { authenticate } from '../middleware/authMiddleware';
import { authorize } from '../middleware/authMiddleware';
import { Role } from '@prisma/client';

const router = express.Router();

// Public route for creating a checkup center (e.g. registration)
router.post('/', createCheckupCenter);

// Authenticated routes
router.get('/', authenticate, getCheckupCenters);
router.get('/:id', authenticate, getCheckupCenterById);
router.put('/:id', authenticate, authorize([Role.CHECKUP_CENTER, Role.ADMIN]), updateCheckupCenter);
router.delete('/:id', authenticate, authorize([Role.CHECKUP_CENTER, Role.ADMIN]), deleteCheckupCenter);

// Patient assignment - typically done by an admin or the center itself
router.post('/assign-patient', authenticate, authorize([Role.CHECKUP_CENTER, Role.ADMIN]), assignPatientToCheckupCenter);
router.post('/remove-patient', authenticate, authorize([Role.CHECKUP_CENTER, Role.ADMIN]), removePatientFromCheckupCenter);

// Route to update next visit date for a patient in a checkup center
router.patch('/:checkupCenterId/patients/:patientId/next-visit', authenticate, authorize([Role.CHECKUP_CENTER, Role.ADMIN]), updatePatientNextVisit);

export default router;