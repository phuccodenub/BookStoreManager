import { Router } from 'express';
import { authenticate, authorize, validate } from '../../shared/middleware/index.js';
import { Role } from '../../shared/constants/index.js';
import {
  createVoucherSchema, updateVoucherSchema, voucherIdParam,
  validateVoucherBody, voucherQuerySchema,
} from './vouchers.validation.js';
import * as ctrl from './vouchers.controller.js';

const router = Router();

// Customer
router.post('/vouchers/validate', authenticate, validate({ body: validateVoucherBody }), ctrl.validate);

// Admin
router.get('/vouchers', authenticate, authorize(Role.ADMIN, Role.STAFF), validate({ query: voucherQuerySchema }), ctrl.list);
router.get('/vouchers/:id', authenticate, authorize(Role.ADMIN, Role.STAFF), validate({ params: voucherIdParam }), ctrl.getById);
router.post('/vouchers', authenticate, authorize(Role.ADMIN), validate({ body: createVoucherSchema }), ctrl.create);
router.patch('/vouchers/:id', authenticate, authorize(Role.ADMIN), validate({ params: voucherIdParam, body: updateVoucherSchema }), ctrl.update);
router.delete('/vouchers/:id', authenticate, authorize(Role.ADMIN), validate({ params: voucherIdParam }), ctrl.remove);

export default router;
