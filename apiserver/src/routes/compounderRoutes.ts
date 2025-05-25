import express from 'express';
import {
  getCompounders,
  getCompounderById,
  createCompounder,
  updateCompounder,
  deleteCompounder,
  assignCompounderToHospital,
  assignCompounderToClinic,
  assignCompounderToMedStore,
  removeCompounderFromClinic,
  removeCompounderFromMedStore
} from '../controllers/compounderController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticate, getCompounders);
router.get('/:id', authenticate, getCompounderById);
router.post('/', createCompounder);
router.put('/:id', authenticate, updateCompounder);
router.delete('/:id', authenticate, deleteCompounder);
router.post('/assign-hospital', authenticate, assignCompounderToHospital);
router.post('/assign-clinic', authenticate, assignCompounderToClinic);
router.post('/assign-medstore', authenticate, assignCompounderToMedStore);
router.post('/remove-clinic', authenticate, removeCompounderFromClinic);
router.post('/remove-medstore', authenticate, removeCompounderFromMedStore);

export default router; 