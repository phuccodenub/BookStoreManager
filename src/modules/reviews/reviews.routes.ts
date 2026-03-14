import { Router } from 'express';
import { authenticate, rateLimit, validate } from '../../shared/middleware/index.js';
import {
  createReviewSchema,
  createReviewByBookSchema,
  reviewQuerySchema,
  reviewBookParam,
  reviewIdParam,
  updateReviewSchema,
} from './reviews.validation.js';
import * as ctrl from './reviews.controller.js';

const router = Router();

const reviewLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 10,
  message: 'Too many review submissions. Please try again later.',
});

router.get('/reviews/:bookId', validate({ params: reviewBookParam, query: reviewQuerySchema }), ctrl.listByBook);
router.get('/books/:bookId/reviews', validate({ params: reviewBookParam, query: reviewQuerySchema }), ctrl.listByBook);
router.post('/reviews', authenticate, reviewLimiter, validate({ body: createReviewSchema }), ctrl.create);
router.post('/books/:bookId/reviews', authenticate, reviewLimiter, validate({ params: reviewBookParam, body: createReviewByBookSchema }), ctrl.createForBook);
router.patch('/reviews/:id', authenticate, validate({ params: reviewIdParam, body: updateReviewSchema }), ctrl.update);
router.delete('/reviews/:id', authenticate, validate({ params: reviewIdParam }), ctrl.remove);

export default router;
