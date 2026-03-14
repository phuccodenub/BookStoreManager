import { Router } from 'express';
import { authenticate, authorize, validate } from '../../shared/middleware/index.js';
import { upload } from '../../shared/storage/index.js';
import { Role } from '../../shared/constants/index.js';
import {
  updateProfileSchema,
  adminCreateUserSchema,
  adminUpdateUserSchema,
  updateStatusSchema,
  paginationSchema,
  idParamSchema,
} from './users.validation.js';
import * as ctrl from './users.controller.js';

const router = Router();

/* ── Personal profile ── */
router.get('/users/me',   authenticate, ctrl.getMe);
router.patch('/users/me',  authenticate, validate({ body: updateProfileSchema }), ctrl.updateMe);
router.post('/users/me/avatar', authenticate, upload.single('avatar'), ctrl.uploadAvatar);

/* ── Admin management ── */
router.get('/users',      authenticate, authorize(Role.ADMIN), validate({ query: paginationSchema }), ctrl.list);
router.get('/users/:id',  authenticate, authorize(Role.ADMIN), validate({ params: idParamSchema }), ctrl.getById);
router.post('/users',     authenticate, authorize(Role.ADMIN), validate({ body: adminCreateUserSchema }), ctrl.create);
router.patch('/users/:id', authenticate, authorize(Role.ADMIN), validate({ params: idParamSchema, body: adminUpdateUserSchema }), ctrl.update);
router.patch('/users/:id/status', authenticate, authorize(Role.ADMIN), validate({ params: idParamSchema, body: updateStatusSchema }), ctrl.updateStatus);
router.delete('/users/:id', authenticate, authorize(Role.ADMIN), validate({ params: idParamSchema }), ctrl.remove);

export default router;
