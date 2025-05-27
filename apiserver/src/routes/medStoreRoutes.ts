import express from 'express';
import {
  getMedStores,
  getMedStoreById,
  createMedStore,
  updateMedStore,
  deleteMedStore,
  getAvailablePrescriptions,
  raiseHandForPrescription,
  withdrawHandForPrescription
} from '../controllers/medStoreController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticate, getMedStores);
router.get('/available-prescriptions', authenticate, getAvailablePrescriptions);
router.get('/:id', authenticate, getMedStoreById);
router.post('/', createMedStore);
router.put('/:id', authenticate, updateMedStore);
router.delete('/:id', authenticate, deleteMedStore);

router.post('/:medStoreId/raise-hand/:medDocumentId', authenticate, raiseHandForPrescription);
router.delete('/:medStoreId/withdraw-hand/:medDocumentId', authenticate, withdrawHandForPrescription);

export default router; 