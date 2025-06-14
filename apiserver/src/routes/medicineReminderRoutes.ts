import express from 'express';
import { authenticate } from '../middleware';
import {
  getPatientReminderTimes,
  setReminderTimes,
  updateReminderTime,
  markMedicineTaken,
  getMedicineItemReminderTimes
} from '../controllers/medicineReminderController';

const router = express.Router();

// Get all reminder times for the authenticated patient
router.get('/patient', authenticate, getPatientReminderTimes);

// Get reminder times for a specific medicine item
router.get('/medicine-item/:medicineItemId', authenticate, getMedicineItemReminderTimes);

// Set reminder times for a medicine item
router.post('/set', authenticate, setReminderTimes);

// Update a specific reminder time
router.put('/:reminderId', authenticate, updateReminderTime);

// Mark medicine as taken for a specific reminder
router.post('/:reminderId/taken', authenticate, markMedicineTaken);

export default router; 