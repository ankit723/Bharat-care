import express from 'express';
import {
  getHospitals,
  getHospitalById,
  createHospital,
  updateHospital,
  deleteHospital,
  assignPatientToHospital,
  removePatientFromHospital
} from '../controllers/hospitalController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', getHospitals);
router.get('/:id', getHospitalById);
router.post('/', createHospital);
router.put('/:id', authenticate, updateHospital);
router.delete('/:id', authenticate, deleteHospital);
router.post('/assign-patient', authenticate, assignPatientToHospital);
router.post('/remove-patient', authenticate, removePatientFromHospital);

export default router; 