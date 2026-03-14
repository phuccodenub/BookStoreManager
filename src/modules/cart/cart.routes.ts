import { Router } from 'express';
import { authenticate, validate } from '../../shared/middleware/index.js';
import { addItemSchema, updateItemSchema, itemIdParam } from './cart.validation.js';
import * as ctrl from './cart.controller.js';

const router = Router();

router.get('/cart',             authenticate, ctrl.get);
router.post('/cart/items',      authenticate, validate({ body: addItemSchema }), ctrl.addItem);
router.patch('/cart/items/:id', authenticate, validate({ params: itemIdParam, body: updateItemSchema }), ctrl.updateItem);
router.delete('/cart/items/:id', authenticate, validate({ params: itemIdParam }), ctrl.removeItem);

export default router;
