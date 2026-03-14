import { Router } from 'express';
import { rateLimit, validate } from '../../shared/middleware/index.js';
import { paymentWebhookSchema } from './payments.validation.js';
import * as ctrl from './payments.controller.js';

const router = Router();

const webhookLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  message: 'Too many webhook requests. Please try again later.',
});

router.post('/payments/webhook', webhookLimiter, validate({ body: paymentWebhookSchema }), ctrl.webhook);

export default router;
