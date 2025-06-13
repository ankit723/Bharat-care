import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { uploadPrescription, getMyPrescriptions } from '../controllers/prescriptionController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Upload prescription (for patients)
router.post('/upload', authorize(['PATIENT', 'patient']), uploadPrescription);

// Get my prescriptions (for patients)
router.get('/my-prescriptions', authorize(['PATIENT', 'patient']), getMyPrescriptions);

export default router; 