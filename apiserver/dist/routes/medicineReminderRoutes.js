"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const medicineReminderController_1 = require("../controllers/medicineReminderController");
const router = express_1.default.Router();
// Get all reminder times for the authenticated patient
router.get('/patient', auth_1.authenticateToken, medicineReminderController_1.getPatientReminderTimes);
// Get reminder times for a specific medicine item
router.get('/medicine-item/:medicineItemId', auth_1.authenticateToken, medicineReminderController_1.getMedicineItemReminderTimes);
// Set reminder times for a medicine item
router.post('/set', auth_1.authenticateToken, medicineReminderController_1.setReminderTimes);
// Update a specific reminder time
router.put('/:reminderId', auth_1.authenticateToken, medicineReminderController_1.updateReminderTime);
// Mark medicine as taken for a specific reminder
router.post('/:reminderId/taken', auth_1.authenticateToken, medicineReminderController_1.markMedicineTaken);
exports.default = router;
