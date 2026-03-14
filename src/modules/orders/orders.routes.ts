import { Router } from 'express';
import { authenticate, authorize, validate } from '../../shared/middleware/index.js';
import { Role } from '../../shared/constants/index.js';
import {
  createOrderSchema, orderIdParam, cancelOrderSchema,
  orderQuerySchema, adminOrderQuerySchema, updateOrderStatusSchema,
} from './orders.validation.js';
import * as ctrl from './orders.controller.js';

const router = Router();

/* Customer routes */
router.post('/orders',              authenticate, validate({ body: createOrderSchema }), ctrl.create);
router.get('/orders/me',            authenticate, validate({ query: orderQuerySchema }), ctrl.listMine);
router.get('/orders/me/:id',        authenticate, validate({ params: orderIdParam }), ctrl.getMine);
router.patch('/orders/me/:id/cancel', authenticate, validate({ params: orderIdParam, body: cancelOrderSchema }), ctrl.cancelMine);

/* Admin routes */
router.get('/orders',                authenticate, authorize(Role.ADMIN, Role.STAFF), validate({ query: adminOrderQuerySchema }), ctrl.listAll);
router.get('/orders/:id/invoice',    authenticate, authorize(Role.ADMIN, Role.STAFF), validate({ params: orderIdParam }), ctrl.downloadInvoice);
router.get('/orders/:id/delivery-note', authenticate, authorize(Role.ADMIN, Role.STAFF), validate({ params: orderIdParam }), ctrl.downloadDeliveryNote);
router.get('/orders/:id',            authenticate, authorize(Role.ADMIN, Role.STAFF), validate({ params: orderIdParam }), ctrl.getById);
router.patch('/orders/:id/status',   authenticate, authorize(Role.ADMIN, Role.STAFF), validate({ params: orderIdParam, body: updateOrderStatusSchema }), ctrl.updateStatus);

export default router;
