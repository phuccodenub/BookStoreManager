import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../../shared/prisma/index.js';
import { sendSuccess } from '../../shared/http/index.js';

const router = Router();

router.get('/health', async (_req, res) => {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch { /* db unreachable */ }

  sendSuccess(
    res,
    {
      status: dbOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database: dbOk ? 'connected' : 'disconnected',
    },
    'Success',
    dbOk ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE,
  );
});

export default router;
