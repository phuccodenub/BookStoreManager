import { Router } from 'express';
import { authenticate, authorize, validate } from '../../shared/middleware/index.js';
import { Role } from '../../shared/constants/index.js';
import { activityLogQuerySchema } from './activity-logs.validation.js';
import * as ctrl from './activity-logs.controller.js';

const router = Router();

router.get('/activity-logs', authenticate, authorize(Role.ADMIN), validate({ query: activityLogQuerySchema }), ctrl.list);

export default router;
