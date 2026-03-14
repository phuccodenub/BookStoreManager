import { Router } from 'express';
import { authenticate, rateLimit, validate } from '../../shared/middleware/index.js';
import { paymentOrderParamSchema, paymentWebhookSchema } from './payments.validation.js';
import * as ctrl from './payments.controller.js';

const router = Router();

const webhookLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  message: 'Too many webhook requests. Please try again later.',
});

router.get('/payments/:orderId', authenticate, validate({ params: paymentOrderParamSchema }), ctrl.getByOrderId);
router.post('/payments/webhook', webhookLimiter, validate({ body: paymentWebhookSchema }), ctrl.webhook);

export default router;
