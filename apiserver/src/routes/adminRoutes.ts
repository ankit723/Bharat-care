import express from 'express';
import {
  getPendingVerifications,
  updateVerificationStatus,
  getAdminDocuments,
  getDocumentStats,
  getAdminDocumentById,
  deleteAdminDocument,
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

// Admin document management routes
router.get(
  '/documents',
  authenticate,
  authorizeAdmin,
  getAdminDocuments
);

router.get(
  '/documents/stats',
  authenticate,
  authorizeAdmin,
  getDocumentStats
);

router.get(
  '/documents/:id',
  authenticate,
  authorizeAdmin,
  getAdminDocumentById
);

router.delete(
  '/documents/:id',
  authenticate,
  authorizeAdmin,
  deleteAdminDocument
);

export default router; 