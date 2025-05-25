"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const doctorController_1 = require("../controllers/doctorController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get('/', authMiddleware_1.authenticate, doctorController_1.getDoctors);
router.get('/:id', authMiddleware_1.authenticate, doctorController_1.getDoctorById);
router.post('/', doctorController_1.createDoctor);
router.put('/:id', authMiddleware_1.authenticate, doctorController_1.updateDoctor);
router.delete('/:id', authMiddleware_1.authenticate, doctorController_1.deleteDoctor);
router.post('/assign', authMiddleware_1.authenticate, doctorController_1.assignDoctorToHospital);
router.post('/assign-patient', authMiddleware_1.authenticate, doctorController_1.assignPatientToDoctor);
router.post('/remove-patient', authMiddleware_1.authenticate, doctorController_1.removePatientFromDoctor);
exports.default = router;
