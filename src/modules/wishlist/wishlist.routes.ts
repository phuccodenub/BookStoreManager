import { Router } from 'express';
import { authenticate, validate } from '../../shared/middleware/index.js';
import { wishlistBookParam, wishlistQuerySchema } from './wishlist.validation.js';
import * as ctrl from './wishlist.controller.js';

const router = Router();

router.get('/wishlist',            authenticate, validate({ query: wishlistQuerySchema }), ctrl.list);
router.post('/wishlist/:bookId',   authenticate, validate({ params: wishlistBookParam }), ctrl.add);
router.delete('/wishlist/:bookId', authenticate, validate({ params: wishlistBookParam }), ctrl.remove);

export default router;
