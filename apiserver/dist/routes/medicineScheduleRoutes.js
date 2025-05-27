"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const medicineScheduleController_1 = require("../controllers/medicineScheduleController");
const authMiddleware_1 = require("../middleware/authMiddleware"); // Assuming authorize can check for multiple roles
const router = express_1.default.Router();
// Create a new medicine schedule (Doctors and MedStores)
router.post('/', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['DOCTOR', 'MEDSTORE']), medicineScheduleController_1.createMedicineSchedule);
// Get all schedules for a specific patient (Patient for self, any Doctor, any MedStore, Admin)
// More specific authorization handled in controller for now
router.get('/patient/:patientId', authMiddleware_1.authenticate, medicineScheduleController_1.getSchedulesForPatient);
// Get schedules created by the logged-in Doctor
router.get('/doctor/mine', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['DOCTOR']), medicineScheduleController_1.getSchedulesCreatedByDoctor);
// Get schedules created by the logged-in MedStore
router.get('/medstore/mine', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['MEDSTORE']), medicineScheduleController_1.getSchedulesCreatedByMedStore);
// Update a medicine schedule (Original scheduler or Admin)
// Specific authorization handled in controller
router.put('/:scheduleId', authMiddleware_1.authenticate, medicineScheduleController_1.updateMedicineSchedule);
// Delete a medicine schedule (Original scheduler or Admin)
// Specific authorization handled in controller
router.delete('/:scheduleId', authMiddleware_1.authenticate, medicineScheduleController_1.deleteMedicineSchedule);
exports.default = router;
