import { Router } from 'express';
import { authenticate, authorize, validate, optionalAuth } from '../../shared/middleware/index.js';
import { Role } from '../../shared/constants/index.js';
import { upload } from '../../shared/storage/index.js';
import { createBannerSchema, updateBannerSchema, idParam } from './banners.validation.js';
import * as ctrl from './banners.controller.js';

const router = Router();

router.get('/banners',          optionalAuth, ctrl.listPublic);
router.get('/banners/all',      authenticate, authorize(Role.ADMIN, Role.STAFF), ctrl.listAll);
router.post('/banners',         authenticate, authorize(Role.ADMIN), upload.single('image'), validate({ body: createBannerSchema }), ctrl.create);
router.patch('/banners/:id',    authenticate, authorize(Role.ADMIN), validate({ params: idParam, body: updateBannerSchema }), ctrl.update);
router.delete('/banners/:id',   authenticate, authorize(Role.ADMIN), validate({ params: idParam }), ctrl.remove);

export default router;
