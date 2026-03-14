import { Router } from 'express';
import { authenticate, authorize, validate } from '../../shared/middleware/index.js';
import { Role } from '../../shared/constants/index.js';
import { timeRangeQuery, topQuery } from './reports.validation.js';
import * as ctrl from './reports.controller.js';

const router = Router();

router.get('/reports/dashboard',    authenticate, authorize(Role.ADMIN), ctrl.dashboard);
router.get('/reports/revenue',      authenticate, authorize(Role.ADMIN), validate({ query: timeRangeQuery }), ctrl.revenue);
router.get('/reports/best-sellers', authenticate, authorize(Role.ADMIN), validate({ query: topQuery }), ctrl.bestSellers);
router.get('/reports/inventory',    authenticate, authorize(Role.ADMIN, Role.STAFF), ctrl.inventory);
router.get('/reports/cancelled',    authenticate, authorize(Role.ADMIN), validate({ query: timeRangeQuery }), ctrl.cancelled);
router.get('/reports/top-customers', authenticate, authorize(Role.ADMIN), validate({ query: topQuery }), ctrl.topCustomers);

export default router;
