import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './shared/config/index.js';
import { logger } from './shared/logger/index.js';
import { prisma } from './shared/prisma/index.js';
import { setupSocket } from './shared/socket/index.js';

const app = createApp();
const httpServer = createServer(app);

/* Socket.IO */
setupSocket(httpServer);

async function startServer() {
  try {
    await prisma.$connect();

    httpServer.listen(env.PORT, () => {
      logger.info(`🚀 Server running on ${env.APP_BASE_URL}`);
      logger.info(`📚 Swagger docs at ${env.APP_BASE_URL}/api-docs`);
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to connect to PostgreSQL during startup');
    process.exit(1);
  }
}

void startServer();
