import express from 'express';
import { 
  createClinic, 
  deleteClinic, 
  getClinics, 
  getClinicById, 
  updateClinic,
  assignDoctorToClinic,
  removeDoctorFromClinic,
  assignCompounderToClinic,
  removeCompounderFromClinic
} from '../controllers/clinicController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticate, getClinics);
router.get('/:id', authenticate, getClinicById);
router.post('/', createClinic);
router.put('/:id', authenticate, updateClinic);
router.delete('/:id', authenticate, deleteClinic);
router.post('/:id/assign-doctor', authenticate, assignDoctorToClinic);
router.post('/:id/remove-doctor', authenticate, removeDoctorFromClinic);
router.post('/:id/assign-compounder', authenticate, assignCompounderToClinic);
router.post('/:id/remove-compounder', authenticate, removeCompounderFromClinic);

export default router;