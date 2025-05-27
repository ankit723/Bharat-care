"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../controllers/adminController");
const authMiddleware_1 = require("../middleware/authMiddleware"); // Assuming authorizeAdmin middleware exists or will be created
const router = express_1.default.Router();
// Get all entities pending verification
router.get('/pending-verifications', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, // Protect this route for admins only
adminController_1.getPendingVerifications);
// Update verification status for a specific entity
router.patch('/verification/:entityType/:entityId', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, // Protect this route for admins only
adminController_1.updateVerificationStatus);
exports.default = router;
