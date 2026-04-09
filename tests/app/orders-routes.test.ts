import express from 'express';
import request from 'supertest';
import { describe, expect, test, vi } from 'vitest';

const controllerMock = vi.hoisted(() => ({
  cancelMine: vi.fn(),
  create: vi.fn(),
  createManual: vi.fn(),
  downloadDeliveryNote: vi.fn(),
  downloadInvoice: vi.fn(),
  getById: vi.fn(),
  getMine: vi.fn(),
  listAll: vi.fn(),
  listMine: vi.fn(),
  updateOps: vi.fn(),
  updateStatus: vi.fn(),
}));

vi.mock('../../src/shared/middleware/index.js', async () => {
  const actual = await vi.importActual<typeof import('../../src/shared/middleware/index.js')>('../../src/shared/middleware/index.js');

  return {
    ...actual,
    authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
      const isAdmin = req.headers.authorization === 'Bearer admin';
      (req as unknown as Record<string, unknown>)['user'] = {
        userId: isAdmin ? 'admin-1' : 'user-1',
        role: isAdmin ? 'admin' : 'customer',
      };
      next();
    },
    authorize: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  };
});

vi.mock('../../src/modules/orders/orders.controller.js', () => controllerMock);

const { globalErrorHandler } = await import('../../src/shared/errors/index.js');
const ordersRoutes = (await import('../../src/modules/orders/orders.routes.js')).default;

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', ordersRoutes);
  app.use(globalErrorHandler);
  return app;
}

describe('orders routes validation', () => {
  test('rejects invalid customer status filters with a 400 validation error', async () => {
    const response = await request(makeApp())
      .get('/api/orders/me?status=foo')
      .set('Authorization', 'Bearer customer');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(controllerMock.listMine).not.toHaveBeenCalled();
  });

  test('rejects invalid admin status filters with a 400 validation error', async () => {
    const response = await request(makeApp())
      .get('/api/orders?status=foo')
      .set('Authorization', 'Bearer admin');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(controllerMock.listAll).not.toHaveBeenCalled();
  });
});
