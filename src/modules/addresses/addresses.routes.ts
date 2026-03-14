import { Router } from 'express';
import { authenticate, validate } from '../../shared/middleware/index.js';
import { createAddressSchema, updateAddressSchema, idParamSchema } from './addresses.validation.js';
import * as ctrl from './addresses.controller.js';

const router = Router();

router.get('/addresses',      authenticate, ctrl.list);
router.post('/addresses',     authenticate, validate({ body: createAddressSchema }), ctrl.create);
router.patch('/addresses/:id', authenticate, validate({ params: idParamSchema, body: updateAddressSchema }), ctrl.update);
router.delete('/addresses/:id', authenticate, validate({ params: idParamSchema }), ctrl.remove);

export default router;
