import express from 'express';
import { getHomeRecommendations } from '../controllers/homeController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Get personalized home recommendations for patient
router.get('/recommendations', authenticate, authorize(['PATIENT']), getHomeRecommendations);

export default router; 