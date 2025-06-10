import express from 'express';
import { 
  createReferral, 
  completeReferral, 
  getUserPoints, 
  getUserRewardHistory, 
  getUserReferrals,
  getRewardSettings,
  updateRewardSetting,
  createServiceReferral
} from '../controllers/rewardController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Referral routes
router.post('/referrals', authenticate, createReferral);
router.put('/referrals/:referralId/complete', authenticate, completeReferral);

// Service referral routes
router.post('/service-referrals', authenticate, createServiceReferral);

// Reward routes
router.get('/points', authenticate, getUserPoints);
router.get('/history', authenticate, getUserRewardHistory);
router.get('/referrals', authenticate, getUserReferrals);

// Admin-only routes
router.get('/settings', authenticate, authorize(['ADMIN']), getRewardSettings);
router.put('/settings', authenticate, authorize(['ADMIN']), updateRewardSetting);

export default router; 