import express from 'express';
import {
  createMedicineSchedule,
  getSchedulesForPatient,
  getSchedulesCreatedByDoctor,
  getSchedulesCreatedByMedStore,
  updateMedicineSchedule,
  deleteMedicineSchedule,
  confirmMedicine,
} from '../controllers/medicineScheduleController';
import { authenticate, authorize } from '../middleware/authMiddleware'; // Assuming authorize can check for multiple roles

const router = express.Router();

// Create a new medicine schedule (Doctors and MedStores)
router.post('/', authenticate, authorize(['DOCTOR', 'MEDSTORE']), createMedicineSchedule);

// Get schedules for a specific patient
router.get('/patient/:patientId', authenticate, getSchedulesForPatient);

// Get schedules for logged-in patient
router.get('/patient', authenticate, authorize(['PATIENT']), async (req, res) => {
  // Redirect to getSchedulesForPatient with the patient's own ID
  req.params.patientId = req.user?.userId || '';
  return getSchedulesForPatient(req as any, res);
});

// Get schedules created by the logged-in Doctor
router.get('/doctor/mine', authenticate, authorize(['DOCTOR']), getSchedulesCreatedByDoctor);

// Get schedules created by the logged-in MedStore
router.get('/medstore/mine', authenticate, authorize(['MEDSTORE']), getSchedulesCreatedByMedStore);

// Confirm medicine taken by patient
router.post('/confirm', authenticate, authorize(['PATIENT']), confirmMedicine);

// Update a medicine schedule
router.put('/:scheduleId', authenticate, updateMedicineSchedule);

// Delete a medicine schedule
router.delete('/:scheduleId', authenticate, deleteMedicineSchedule);

export default router; 