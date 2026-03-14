import { Router } from 'express';
import { authenticate, authorize, validate, optionalAuth } from '../../shared/middleware/index.js';
import { Role } from '../../shared/constants/index.js';
import { upload } from '../../shared/storage/index.js';
import { createAuthorSchema, updateAuthorSchema, idParam, listQuery } from './authors.validation.js';
import * as ctrl from './authors.controller.js';

const router = Router();

router.get('/authors',      optionalAuth, validate({ query: listQuery }), ctrl.list);
router.get('/authors/:id',  optionalAuth, validate({ params: idParam }), ctrl.getById);
router.post('/authors',     authenticate, authorize(Role.ADMIN), validate({ body: createAuthorSchema }), ctrl.create);
router.patch('/authors/:id', authenticate, authorize(Role.ADMIN), validate({ params: idParam, body: updateAuthorSchema }), ctrl.update);
router.delete('/authors/:id', authenticate, authorize(Role.ADMIN), validate({ params: idParam }), ctrl.remove);
router.post('/authors/:id/avatar', authenticate, authorize(Role.ADMIN), validate({ params: idParam }), upload.single('avatar'), ctrl.uploadAvatar);

export default router;
