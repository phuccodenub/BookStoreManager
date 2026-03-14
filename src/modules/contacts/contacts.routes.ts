import { Router } from 'express';
import { authenticate, authorize, rateLimit, validate } from '../../shared/middleware/index.js';
import { Role } from '../../shared/constants/index.js';
import { createContactSchema, updateContactSchema, contactIdParam, contactQuerySchema } from './contacts.validation.js';
import * as ctrl from './contacts.controller.js';

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 10,
  message: 'Too many contact submissions. Please try again later.',
});

router.post('/contacts', contactLimiter, validate({ body: createContactSchema }), ctrl.create);

router.get('/contacts', authenticate, authorize(Role.ADMIN, Role.STAFF), validate({ query: contactQuerySchema }), ctrl.list);
router.get('/contacts/:id', authenticate, authorize(Role.ADMIN, Role.STAFF), validate({ params: contactIdParam }), ctrl.getById);
router.patch('/contacts/:id', authenticate, authorize(Role.ADMIN, Role.STAFF), validate({ params: contactIdParam, body: updateContactSchema }), ctrl.update);
router.delete('/contacts/:id', authenticate, authorize(Role.ADMIN), validate({ params: contactIdParam }), ctrl.remove);

export default router;
