import { Router } from 'express';
import { authenticate, authorize, validate } from '../../shared/middleware/index.js';
import { Role } from '../../shared/constants/index.js';
import * as ctrl from './settings.controller.js';
import { updateSettingsSchema } from './settings.validation.js';

const router = Router();

router.get('/settings', ctrl.getPublic);
router.patch('/settings', authenticate, authorize(Role.ADMIN), validate({ body: updateSettingsSchema }), ctrl.update);

export default router;
