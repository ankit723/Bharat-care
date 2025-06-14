"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const globalMedicineController_1 = require("../controllers/globalMedicineController");
const router = express_1.default.Router();
// All routes require authentication
router.use(authMiddleware_1.authenticate);
// Create global medicine request (for patients)
router.post('/request', (0, authMiddleware_1.authorize)(['PATIENT', 'patient']), globalMedicineController_1.createGlobalMedicineRequest);
// Get my global medicine requests (for patients)
router.get('/my-requests', (0, authMiddleware_1.authorize)(['PATIENT', 'patient']), globalMedicineController_1.getMyGlobalMedicineRequests);
exports.default = router;
