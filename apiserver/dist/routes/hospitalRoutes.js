"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const hospitalController_1 = require("../controllers/hospitalController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get('/', hospitalController_1.getHospitals);
router.get('/:id', hospitalController_1.getHospitalById);
router.post('/', hospitalController_1.createHospital);
router.put('/:id', authMiddleware_1.authenticate, hospitalController_1.updateHospital);
router.delete('/:id', authMiddleware_1.authenticate, hospitalController_1.deleteHospital);
router.post('/assign-patient', authMiddleware_1.authenticate, hospitalController_1.assignPatientToHospital);
router.post('/remove-patient', authMiddleware_1.authenticate, hospitalController_1.removePatientFromHospital);
exports.default = router;
