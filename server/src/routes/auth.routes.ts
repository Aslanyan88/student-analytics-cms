// server/src/routes/auth.routes.ts
import express from 'express';
import { body } from 'express-validator';
import { 
  login, 
  register, 
  registerStudent, 
  forgotPassword, 
  resetPassword, 
  getMe,
  debugResetTokens
} from '../controllers/auth.contoller'; // Fix: Correct path from auth.contoller to auth.controller
import { validateRequest } from '../middleware/validation.midlware'; // Fix: Correct path
import { authMiddleware } from '../middleware/auth.middleware'; // Fix: Using authMiddleware instead of protect
import { validateResetToken } from '../middleware/reset-token-middleware';

const router = express.Router();

// Login validation
const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Register validation
const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('role').isIn(['ADMIN', 'TEACHER']).withMessage('Invalid role')
];

// Routes
router.post('/login', loginValidation, validateRequest, login);
router.post('/register', registerValidation, validateRequest, register);
router.get('/me', authMiddleware, getMe);

// Placeholder routes for future implementation
router.post('/register-student', registerStudent);
router.post('/forgot-password', forgotPassword);
router.get('/debug-reset-tokens', debugResetTokens);
router.post('/reset-password/:resetToken', validateResetToken, resetPassword);
router.post('/reset-password/:resetToken', resetPassword);

export default router;