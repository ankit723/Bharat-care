"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const prescriptionController_1 = require("../controllers/prescriptionController");
const router = express_1.default.Router();
// All routes require authentication
router.use(authMiddleware_1.authenticate);
// Upload prescription (for patients)
router.post('/upload', (0, authMiddleware_1.authorize)(['PATIENT', 'patient']), prescriptionController_1.uploadPrescription);
// Get my prescriptions (for patients)
router.get('/my-prescriptions', (0, authMiddleware_1.authorize)(['PATIENT', 'patient']), prescriptionController_1.getMyPrescriptions);
exports.default = router;
