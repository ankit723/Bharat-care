import express from 'express';
import { login, register, getCurrentUser } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.get('/current-user', authenticate, getCurrentUser);

export default router; 