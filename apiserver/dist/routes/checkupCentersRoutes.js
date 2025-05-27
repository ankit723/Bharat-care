"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const checkupCenters_1 = require("../controllers/checkupCenters");
const authMiddleware_1 = require("../middleware/authMiddleware");
const authMiddleware_2 = require("../middleware/authMiddleware");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
// Public route for creating a checkup center (e.g. registration)
router.post('/', checkupCenters_1.createCheckupCenter);
// Authenticated routes
router.get('/', authMiddleware_1.authenticate, checkupCenters_1.getCheckupCenters);
router.get('/:id', authMiddleware_1.authenticate, checkupCenters_1.getCheckupCenterById);
router.put('/:id', authMiddleware_1.authenticate, (0, authMiddleware_2.authorize)([client_1.Role.CHECKUP_CENTER, client_1.Role.ADMIN]), checkupCenters_1.updateCheckupCenter);
router.delete('/:id', authMiddleware_1.authenticate, (0, authMiddleware_2.authorize)([client_1.Role.CHECKUP_CENTER, client_1.Role.ADMIN]), checkupCenters_1.deleteCheckupCenter);
// Patient assignment - typically done by an admin or the center itself
router.post('/assign-patient', authMiddleware_1.authenticate, (0, authMiddleware_2.authorize)([client_1.Role.CHECKUP_CENTER, client_1.Role.ADMIN]), checkupCenters_1.assignPatientToCheckupCenter);
router.post('/remove-patient', authMiddleware_1.authenticate, (0, authMiddleware_2.authorize)([client_1.Role.CHECKUP_CENTER, client_1.Role.ADMIN]), checkupCenters_1.removePatientFromCheckupCenter);
// Route to update next visit date for a patient in a checkup center
router.patch('/:checkupCenterId/patients/:patientId/next-visit', authMiddleware_1.authenticate, (0, authMiddleware_2.authorize)([client_1.Role.CHECKUP_CENTER, client_1.Role.ADMIN]), checkupCenters_1.updatePatientNextVisit);
exports.default = router;
