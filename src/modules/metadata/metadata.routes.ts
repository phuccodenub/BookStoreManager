import { Router } from 'express';
import * as ctrl from './metadata.controller.js';

const router = Router();

router.get('/metadata/enums', ctrl.enums);

export default router;
