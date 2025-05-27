import express from 'express';
import {
  getPendingVerifications,
  updateVerificationStatus,
} from '../controllers/adminController';
import { authenticate, authorizeAdmin } from '../middleware/authMiddleware'; // Assuming authorizeAdmin middleware exists or will be created

const router = express.Router();

// Get all entities pending verification
router.get(
  '/pending-verifications',
  authenticate, 
  authorizeAdmin, // Protect this route for admins only
  getPendingVerifications
);

// Update verification status for a specific entity
router.patch(
  '/verification/:entityType/:entityId',
  authenticate, 
  authorizeAdmin, // Protect this route for admins only
  updateVerificationStatus
);

export default router; 