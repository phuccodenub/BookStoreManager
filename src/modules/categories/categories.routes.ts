import { Router } from 'express';
import { authenticate, authorize, validate, optionalAuth } from '../../shared/middleware/index.js';
import { Role } from '../../shared/constants/index.js';
import { createCategorySchema, updateCategorySchema, idParam, listQuery } from './categories.validation.js';
import * as ctrl from './categories.controller.js';

const router = Router();

router.get('/categories',      optionalAuth, validate({ query: listQuery }), ctrl.list);
router.get('/categories/:id',  optionalAuth, validate({ params: idParam }), ctrl.getById);
router.post('/categories',     authenticate, authorize(Role.ADMIN), validate({ body: createCategorySchema }), ctrl.create);
router.patch('/categories/:id', authenticate, authorize(Role.ADMIN), validate({ params: idParam, body: updateCategorySchema }), ctrl.update);
router.delete('/categories/:id', authenticate, authorize(Role.ADMIN), validate({ params: idParam }), ctrl.remove);

export default router;
