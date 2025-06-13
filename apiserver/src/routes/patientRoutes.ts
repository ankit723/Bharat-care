import express from 'express';
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getCurrentPatientProfile,
  updateCurrentPatientProfile
} from '../controllers/patientController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Get current patient's profile (for mobile app)
router.get('/profile', authenticate, authorize(['PATIENT', 'patient']), getCurrentPatientProfile);

// Update current patient's profile (for mobile app)
router.put('/update', authenticate, authorize(['PATIENT', 'patient']), updateCurrentPatientProfile);

router.get('/', getPatients);
router.get('/:id', getPatientById);
router.post('/', createPatient);
router.put('/:id', updatePatient);
router.delete('/:id', deletePatient);

export default router; 