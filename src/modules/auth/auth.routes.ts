import { Router } from 'express';
import { validate, authenticate, rateLimit } from '../../shared/middleware/index.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validation.js';
import * as ctrl from './auth.controller.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 5,
  message: 'Too many login attempts. Please try again later.',
});
const refreshLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 20,
  message: 'Too many token refresh attempts. Please try again later.',
});
const passwordLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 5,
  message: 'Too many password reset attempts. Please try again later.',
});

router.post('/auth/register', validate({ body: registerSchema }), ctrl.register);
router.post('/auth/login', loginLimiter, validate({ body: loginSchema }), ctrl.login);
router.post('/auth/refresh', refreshLimiter, validate({ body: refreshSchema }), ctrl.refresh);
router.post('/auth/logout', validate({ body: refreshSchema }), ctrl.logout);
router.post('/auth/change-password', authenticate, validate({ body: changePasswordSchema }), ctrl.changePassword);
router.post('/auth/forgot-password', passwordLimiter, validate({ body: forgotPasswordSchema }), ctrl.forgotPassword);
router.post('/auth/reset-password', passwordLimiter, validate({ body: resetPasswordSchema }), ctrl.resetPassword);

export default router;
