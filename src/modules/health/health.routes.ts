import { Router } from 'express';
import { prisma } from '../../shared/prisma/index.js';
import { sendSuccess } from '../../shared/http/index.js';

const router = Router();

router.get('/health', async (_req, res) => {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch { /* db unreachable */ }

  sendSuccess(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbOk ? 'connected' : 'disconnected',
  });
});

export default router;
