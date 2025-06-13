"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const homeController_1 = require("../controllers/homeController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Get personalized home recommendations for patient
router.get('/recommendations', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['PATIENT']), homeController_1.getHomeRecommendations);
exports.default = router;
