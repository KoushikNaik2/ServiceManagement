import express from 'express';
import { signupUser, loginUser, verifyUser, registerUser, updateProfile, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes - no token needed
router.post('/signup', signupUser);
router.post('/login', loginUser);
router.post('/register', registerUser);

// Protected routes - token required
router.post('/verify', protect, verifyUser);
router.get('/me', protect, getMe);
router.patch('/profile/:id', protect, updateProfile);

export default router;
