import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getPatientReminderTimes,
  setReminderTimes,
  updateReminderTime,
  markMedicineTaken,
  getMedicineItemReminderTimes
} from '../controllers/medicineReminderController';

const router = express.Router();

// Get all reminder times for the authenticated patient
router.get('/patient', authenticateToken, getPatientReminderTimes);

// Get reminder times for a specific medicine item
router.get('/medicine-item/:medicineItemId', authenticateToken, getMedicineItemReminderTimes);

// Set reminder times for a medicine item
router.post('/set', authenticateToken, setReminderTimes);

// Update a specific reminder time
router.put('/:reminderId', authenticateToken, updateReminderTime);

// Mark medicine as taken for a specific reminder
router.post('/:reminderId/taken', authenticateToken, markMedicineTaken);

export default router; 