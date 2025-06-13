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
// Get schedules for a specific patient
router.get('/patient/:patientId', authMiddleware_1.authenticate, medicineScheduleController_1.getSchedulesForPatient);
// Get schedules for logged-in patient
router.get('/patient', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['PATIENT']), async (req, res) => {
    // Redirect to getSchedulesForPatient with the patient's own ID
    req.params.patientId = req.user?.userId || '';
    return (0, medicineScheduleController_1.getSchedulesForPatient)(req, res);
});
// Get schedules created by the logged-in Doctor
router.get('/doctor/mine', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['DOCTOR']), medicineScheduleController_1.getSchedulesCreatedByDoctor);
// Get schedules created by the logged-in MedStore
router.get('/medstore/mine', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['MEDSTORE']), medicineScheduleController_1.getSchedulesCreatedByMedStore);
// Confirm medicine taken by patient
router.post('/confirm', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['PATIENT']), medicineScheduleController_1.confirmMedicine);
// Update a medicine schedule
router.put('/:scheduleId', authMiddleware_1.authenticate, medicineScheduleController_1.updateMedicineSchedule);
// Delete a medicine schedule
router.delete('/:scheduleId', authMiddleware_1.authenticate, medicineScheduleController_1.deleteMedicineSchedule);
exports.default = router;
