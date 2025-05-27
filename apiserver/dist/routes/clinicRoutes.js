"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const clinicController_1 = require("../controllers/clinicController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get('/', authMiddleware_1.authenticate, clinicController_1.getClinics);
router.get('/:id', authMiddleware_1.authenticate, clinicController_1.getClinicById);
router.post('/', clinicController_1.createClinic);
router.put('/:id', authMiddleware_1.authenticate, clinicController_1.updateClinic);
router.delete('/:id', authMiddleware_1.authenticate, clinicController_1.deleteClinic);
router.post('/:id/assign-doctor', authMiddleware_1.authenticate, clinicController_1.assignDoctorToClinic);
router.post('/:id/remove-doctor', authMiddleware_1.authenticate, clinicController_1.removeDoctorFromClinic);
exports.default = router;
