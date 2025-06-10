"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rewardController_1 = require("../controllers/rewardController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Referral routes
router.post('/referrals', authMiddleware_1.authenticate, rewardController_1.createReferral);
router.put('/referrals/:referralId/complete', authMiddleware_1.authenticate, rewardController_1.completeReferral);
// Service referral routes
router.post('/service-referrals', authMiddleware_1.authenticate, rewardController_1.createServiceReferral);
// Reward routes
router.get('/points', authMiddleware_1.authenticate, rewardController_1.getUserPoints);
router.get('/history', authMiddleware_1.authenticate, rewardController_1.getUserRewardHistory);
router.get('/referrals', authMiddleware_1.authenticate, rewardController_1.getUserReferrals);
// Admin-only routes
router.get('/settings', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['ADMIN']), rewardController_1.getRewardSettings);
router.put('/settings', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['ADMIN']), rewardController_1.updateRewardSetting);
exports.default = router;
