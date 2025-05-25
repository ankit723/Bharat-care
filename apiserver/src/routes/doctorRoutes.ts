import express from 'express';
import {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  assignDoctorToHospital,
  assignPatientToDoctor,
  removePatientFromDoctor
} from '../controllers/doctorController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticate, getDoctors);
router.get('/:id', authenticate, getDoctorById);
router.post('/', createDoctor);
router.put('/:id', authenticate, updateDoctor);
router.delete('/:id', authenticate, deleteDoctor);
router.post('/assign', authenticate, assignDoctorToHospital);
router.post('/assign-patient', authenticate, assignPatientToDoctor);
router.post('/remove-patient', authenticate, removePatientFromDoctor);

export default router; 