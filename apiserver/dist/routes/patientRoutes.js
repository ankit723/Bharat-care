"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const patientController_1 = require("../controllers/patientController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Get current patient's profile (for mobile app)
router.get('/profile', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['PATIENT', 'patient']), patientController_1.getCurrentPatientProfile);
// Update current patient's profile (for mobile app)
router.put('/update', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['PATIENT', 'patient']), patientController_1.updateCurrentPatientProfile);
router.get('/', patientController_1.getPatients);
router.get('/:id', patientController_1.getPatientById);
router.post('/', patientController_1.createPatient);
router.put('/:id', patientController_1.updatePatient);
router.delete('/:id', patientController_1.deletePatient);
exports.default = router;
