import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { createGlobalMedicineRequest, getMyGlobalMedicineRequests } from '../controllers/globalMedicineController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create global medicine request (for patients)
router.post('/request', authorize(['PATIENT', 'patient']), createGlobalMedicineRequest);

// Get my global medicine requests (for patients)
router.get('/my-requests', authorize(['PATIENT', 'patient']), getMyGlobalMedicineRequests);

export default router; 