import { Router } from 'express';
import { authenticate, authorize, validate } from '../../shared/middleware/index.js';
import { Role } from '../../shared/constants/index.js';
import {
  createInventoryTxSchema,
  inventoryAdjustmentSchema,
  inventoryExportSchema,
  inventoryImportSchema,
  inventoryQuerySchema,
} from './inventory.validation.js';
import * as ctrl from './inventory.controller.js';

const router = Router();

router.get('/inventory', authenticate, authorize(Role.ADMIN, Role.STAFF), validate({ query: inventoryQuerySchema }), ctrl.list);
router.get('/inventory/transactions', authenticate, authorize(Role.ADMIN, Role.STAFF), validate({ query: inventoryQuerySchema }), ctrl.list);
router.post('/inventory', authenticate, authorize(Role.ADMIN), validate({ body: createInventoryTxSchema }), ctrl.create);
router.post('/inventory/import', authenticate, authorize(Role.ADMIN), validate({ body: inventoryImportSchema }), ctrl.importStock);
router.post('/inventory/export', authenticate, authorize(Role.ADMIN), validate({ body: inventoryExportSchema }), ctrl.exportStock);
router.post('/inventory/adjustment', authenticate, authorize(Role.ADMIN), validate({ body: inventoryAdjustmentSchema }), ctrl.adjustStock);

export default router;
