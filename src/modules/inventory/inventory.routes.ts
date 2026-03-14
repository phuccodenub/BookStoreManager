import { Router } from 'express';
import { authenticate, authorize, validate } from '../../shared/middleware/index.js';
import { Role } from '../../shared/constants/index.js';
import { createInventoryTxSchema, inventoryQuerySchema } from './inventory.validation.js';
import * as ctrl from './inventory.controller.js';

const router = Router();

router.get('/inventory', authenticate, authorize(Role.ADMIN, Role.STAFF), validate({ query: inventoryQuerySchema }), ctrl.list);
router.post('/inventory', authenticate, authorize(Role.ADMIN), validate({ body: createInventoryTxSchema }), ctrl.create);

export default router;
