"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const appointmentController_1 = require("../controllers/appointmentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Patient appointment routes
router.get('/', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['PATIENT']), appointmentController_1.getPatientAppointments);
router.get('/next-visits', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['PATIENT']), appointmentController_1.getNextVisits);
// Schedule appointments
router.post('/doctor', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['PATIENT']), appointmentController_1.scheduleDoctorAppointment);
router.post('/checkup', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['PATIENT']), appointmentController_1.scheduleCheckupAppointment);
// Cancel appointments
router.delete('/doctor/:appointmentId', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['PATIENT']), appointmentController_1.cancelDoctorAppointment);
router.delete('/checkup/:appointmentId', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['PATIENT']), appointmentController_1.cancelCheckupAppointment);
// Provider appointment management
router.get('/doctor/mine', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['DOCTOR']), appointmentController_1.getDoctorAppointments);
router.get('/checkup-center/mine', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['CHECKUP_CENTER']), appointmentController_1.getCheckupCenterAppointments);
exports.default = router;
