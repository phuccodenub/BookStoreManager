import { Router } from 'express';
import { validate } from '../../shared/middleware/index.js';
import { homeQuerySchema } from './home.validation.js';
import * as ctrl from './home.controller.js';

const router = Router();

router.get('/home', validate({ query: homeQuerySchema }), ctrl.getHome);

export default router;
