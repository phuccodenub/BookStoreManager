import { Router } from 'express';
import { authenticate, authorize, validate, optionalAuth } from '../../shared/middleware/index.js';
import { Role } from '../../shared/constants/index.js';
import { upload } from '../../shared/storage/index.js';
import { createBookSchema, updateBookSchema, idParam, listQuery } from './books.validation.js';
import * as ctrl from './books.controller.js';
import { z } from 'zod';

const router = Router();
const imageIdParam = z.object({ id: z.string().uuid(), imageId: z.string().uuid() });

/* Public */
router.get('/books',      optionalAuth, validate({ query: listQuery }), ctrl.list);
router.get('/books/:id',  optionalAuth, validate({ params: idParam }), ctrl.getById);

/* Admin */
router.post('/books',     authenticate, authorize(Role.ADMIN), validate({ body: createBookSchema }), ctrl.create);
router.patch('/books/:id', authenticate, authorize(Role.ADMIN), validate({ params: idParam, body: updateBookSchema }), ctrl.update);
router.delete('/books/:id', authenticate, authorize(Role.ADMIN), validate({ params: idParam }), ctrl.remove);

/* Uploads */
router.post('/books/:id/cover',  authenticate, authorize(Role.ADMIN), validate({ params: idParam }), upload.single('cover'), ctrl.uploadCover);
router.post('/books/:id/images', authenticate, authorize(Role.ADMIN), validate({ params: idParam }), upload.array('images', 10), ctrl.uploadImages);
router.delete('/books/:id/images/:imageId', authenticate, authorize(Role.ADMIN), validate({ params: imageIdParam }), ctrl.removeImage);

export default router;
