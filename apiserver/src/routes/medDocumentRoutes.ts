import express from 'express';
import {
  createMedDocument,
  getMedDocuments,
  getMedDocumentById,
  updateMedDocument,
  deleteMedDocument,
  grantPermissionToDoctor,
  revokePermissionFromDoctor,
  grantPermissionToCheckupCenter,
  revokePermissionFromCheckupCenter
} from '../controllers/medDocumentController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/', createMedDocument);
router.get('/', getMedDocuments);
router.get('/:id', getMedDocumentById);
router.put('/:id', updateMedDocument); // For updating description and permissions
router.delete('/:id', deleteMedDocument);

// Routes for patients to manage permissions for their documents
router.post('/grant-doctor-permission', grantPermissionToDoctor);
router.post('/revoke-doctor-permission', revokePermissionFromDoctor);
router.post('/grant-checkupcenter-permission', grantPermissionToCheckupCenter);
router.post('/revoke-checkupcenter-permission', revokePermissionFromCheckupCenter);

export default router; 