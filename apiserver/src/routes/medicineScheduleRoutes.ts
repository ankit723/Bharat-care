import express from 'express';
import {
  createMedicineSchedule,
  getSchedulesForPatient,
  getSchedulesCreatedByDoctor,
  getSchedulesCreatedByMedStore,
  updateMedicineSchedule,
  deleteMedicineSchedule,
} from '../controllers/medicineScheduleController';
import { authenticate, authorize } from '../middleware/authMiddleware'; // Assuming authorize can check for multiple roles

const router = express.Router();

// Create a new medicine schedule (Doctors and MedStores)
router.post('/', authenticate, authorize(['DOCTOR', 'MEDSTORE']), createMedicineSchedule);

// Get all schedules for a specific patient (Patient for self, any Doctor, any MedStore, Admin)
// More specific authorization handled in controller for now
router.get('/patient/:patientId', authenticate, getSchedulesForPatient);

// Get schedules created by the logged-in Doctor
router.get('/doctor/mine', authenticate, authorize(['DOCTOR']), getSchedulesCreatedByDoctor);

// Get schedules created by the logged-in MedStore
router.get('/medstore/mine', authenticate, authorize(['MEDSTORE']), getSchedulesCreatedByMedStore);

// Update a medicine schedule (Original scheduler or Admin)
// Specific authorization handled in controller
router.put('/:scheduleId', authenticate, updateMedicineSchedule);

// Delete a medicine schedule (Original scheduler or Admin)
// Specific authorization handled in controller
router.delete('/:scheduleId', authenticate, deleteMedicineSchedule);

export default router; 