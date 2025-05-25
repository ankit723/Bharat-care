import express from 'express';
import {
  getMedStores,
  getMedStoreById,
  createMedStore,
  updateMedStore,
  deleteMedStore
} from '../controllers/medStoreController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticate, getMedStores);
router.get('/:id', authenticate, getMedStoreById);
router.post('/', createMedStore);
router.put('/:id', authenticate, updateMedStore);
router.delete('/:id', authenticate, deleteMedStore);

export default router; 