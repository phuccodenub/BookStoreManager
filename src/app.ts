import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttpFactory from 'pino-http';
const pinoHttp = pinoHttpFactory.default ?? pinoHttpFactory;

import { logger } from './shared/logger/index.js';
import { requestIdMiddleware } from './shared/middleware/index.js';
import { globalErrorHandler } from './shared/errors/index.js';
import { setupSwagger } from './shared/swagger/index.js';
import { env } from './shared/config/index.js';

/* ---- Module routes ---- */
import healthRoutes from './modules/health/health.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import addressesRoutes from './modules/addresses/addresses.routes.js';
import categoriesRoutes from './modules/categories/categories.routes.js';
import authorsRoutes from './modules/authors/authors.routes.js';
import publishersRoutes from './modules/publishers/publishers.routes.js';
import booksRoutes from './modules/books/books.routes.js';
import bannersRoutes from './modules/banners/banners.routes.js';
import cartRoutes from './modules/cart/cart.routes.js';
import wishlistRoutes from './modules/wishlist/wishlist.routes.js';
import vouchersRoutes from './modules/vouchers/vouchers.routes.js';
import ordersRoutes from './modules/orders/orders.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import paymentsRoutes from './modules/payments/payments.routes.js';
import reviewsRoutes from './modules/reviews/reviews.routes.js';
import contactsRoutes from './modules/contacts/contacts.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import activityLogsRoutes from './modules/activity-logs/activity-logs.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import metadataRoutes from './modules/metadata/metadata.routes.js';
import homeRoutes from './modules/home/home.routes.js';

export function createApp() {
  const app = express();

  /* ---------- global middleware ---------- */
  app.use(requestIdMiddleware);
  app.use(
    (pinoHttp as Function)({
      logger,
      customProps(req: unknown) {
        return { requestId: (req as Record<string, unknown>)['requestId'] };
      },
    }),
  );
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  /* ---------- static uploads ---------- */
  app.use(`/${env.UPLOAD_DIR}`, express.static(env.UPLOAD_DIR));

  /* ---------- swagger ---------- */
  setupSwagger(app);

  /* ---------- API routes ---------- */
  app.use('/api', healthRoutes);
  app.use('/api', authRoutes);
  app.use('/api', homeRoutes);
  app.use('/api', metadataRoutes);
  app.use('/api', settingsRoutes);
  app.use('/api', usersRoutes);
  app.use('/api', addressesRoutes);
  app.use('/api', categoriesRoutes);
  app.use('/api', authorsRoutes);
  app.use('/api', publishersRoutes);
  app.use('/api', booksRoutes);
  app.use('/api', bannersRoutes);
  app.use('/api', cartRoutes);
  app.use('/api', wishlistRoutes);
  app.use('/api', vouchersRoutes);
  app.use('/api', ordersRoutes);
  app.use('/api', inventoryRoutes);
  app.use('/api', paymentsRoutes);
  app.use('/api', reviewsRoutes);
  app.use('/api', contactsRoutes);
  app.use('/api', reportsRoutes);
  app.use('/api', activityLogsRoutes);

  /* ---------- global error handler (MUST be last) ---------- */
  app.use(globalErrorHandler);

  return app;
}
