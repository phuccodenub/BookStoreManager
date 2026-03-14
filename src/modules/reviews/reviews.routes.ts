import { Router } from 'express';
import { authenticate, rateLimit, validate } from '../../shared/middleware/index.js';
import { createReviewSchema, reviewQuerySchema, reviewBookParam } from './reviews.validation.js';
import * as ctrl from './reviews.controller.js';

const router = Router();

const reviewLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 10,
  message: 'Too many review submissions. Please try again later.',
});

router.get('/reviews/:bookId', validate({ params: reviewBookParam, query: reviewQuerySchema }), ctrl.listByBook);
router.post('/reviews', authenticate, reviewLimiter, validate({ body: createReviewSchema }), ctrl.create);

export default router;
