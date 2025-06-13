import express from 'express';
import {
  getPatientAppointments,
  getNextVisits,
  scheduleDoctorAppointment,
  scheduleCheckupAppointment,
  cancelDoctorAppointment,
  cancelCheckupAppointment,
  getDoctorAppointments,
  getCheckupCenterAppointments,
} from '../controllers/appointmentController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Patient appointment routes
router.get('/', authenticate, authorize(['PATIENT']), getPatientAppointments);
router.get('/next-visits', authenticate, authorize(['PATIENT']), getNextVisits);

// Schedule appointments
router.post('/doctor', authenticate, authorize(['PATIENT']), scheduleDoctorAppointment);
router.post('/checkup', authenticate, authorize(['PATIENT']), scheduleCheckupAppointment);

// Cancel appointments
router.delete('/doctor/:appointmentId', authenticate, authorize(['PATIENT']), cancelDoctorAppointment);
router.delete('/checkup/:appointmentId', authenticate, authorize(['PATIENT']), cancelCheckupAppointment);

// Provider appointment management
router.get('/doctor/mine', authenticate, authorize(['DOCTOR']), getDoctorAppointments);
router.get('/checkup-center/mine', authenticate, authorize(['CHECKUP_CENTER']), getCheckupCenterAppointments);

export default router; 