import { Router } from 'express';
import { authenticate, authorize, validate, optionalAuth } from '../../shared/middleware/index.js';
import { Role } from '../../shared/constants/index.js';
import { createPublisherSchema, updatePublisherSchema, idParam, listQuery } from './publishers.validation.js';
import * as ctrl from './publishers.controller.js';

const router = Router();

router.get('/publishers',      optionalAuth, validate({ query: listQuery }), ctrl.list);
router.get('/publishers/:id',  optionalAuth, validate({ params: idParam }), ctrl.getById);
router.post('/publishers',     authenticate, authorize(Role.ADMIN), validate({ body: createPublisherSchema }), ctrl.create);
router.patch('/publishers/:id', authenticate, authorize(Role.ADMIN), validate({ params: idParam, body: updatePublisherSchema }), ctrl.update);
router.delete('/publishers/:id', authenticate, authorize(Role.ADMIN), validate({ params: idParam }), ctrl.remove);

export default router;
