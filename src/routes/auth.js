import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Authentication routes
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('fullName').optional().isString()
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validate,
  authController.login
);

// Google OAuth routes
router.get('/google', authController.getGoogleAuthUrl);
router.get('/google/callback', authController.handleGoogleCallback);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, authController.updateProfile);
router.put(
  '/password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
  ],
  validate,
  authController.changePassword
);

export default router;
