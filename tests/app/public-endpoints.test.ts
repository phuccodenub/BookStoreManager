import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
  banner: {
    findMany: vi.fn(),
  },
  book: {
    findMany: vi.fn(),
  },
  systemConfig: {
    findUnique: vi.fn(),
  },
}));

vi.mock('../../src/shared/prisma/index.js', () => ({
  prisma: prismaMock,
}));

const { globalErrorHandler } = await import('../../src/shared/errors/index.js');
const healthRoutes = (await import('../../src/modules/health/health.routes.js')).default;
const homeRoutes = (await import('../../src/modules/home/home.routes.js')).default;
const settingsRoutes = (await import('../../src/modules/settings/settings.routes.js')).default;
const metadataRoutes = (await import('../../src/modules/metadata/metadata.routes.js')).default;

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', healthRoutes);
  app.use('/api', homeRoutes);
  app.use('/api', settingsRoutes);
  app.use('/api', metadataRoutes);
  app.use(globalErrorHandler);
  return app;
}

describe('public frontend-facing endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    prismaMock.banner.findMany.mockResolvedValue([{ id: 'banner-1', title: 'Banner' }]);
    prismaMock.book.findMany.mockResolvedValue([{ id: 'book-1', title: 'Book' }]);
    prismaMock.systemConfig.findUnique.mockResolvedValue({
      id: 'default',
      storeName: 'BookStoreManager',
      shippingFee: 25000,
    });
  });

  test('returns home aggregates', async () => {
    const response = await request(makeApp()).get('/api/home');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('featuredBooks');
    expect(prismaMock.banner.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        status: true,
        OR: [{ startDate: null }, { startDate: { lte: expect.any(Date) } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: expect.any(Date) } }] }],
      }),
    }));
  });

  test('returns public settings', async () => {
    const response = await request(makeApp()).get('/api/settings');

    expect(response.status).toBe(200);
    expect(response.body.data.storeName).toBe('BookStoreManager');
  });

  test('returns metadata enums', async () => {
    const response = await request(makeApp()).get('/api/metadata/enums');

    expect(response.status).toBe(200);
    expect(response.body.data.roles).toContain('customer');
    expect(response.body.data.paymentMethods).toContain('online');
    expect(response.body.data.bookSortOptions).toEqual([
      { value: 'price_asc', label: 'Giá tăng dần' },
      { value: 'price_desc', label: 'Giá giảm dần' },
      { value: 'newest', label: 'Mới cập nhật' },
      { value: 'best_seller', label: 'Bán chạy' },
    ]);
  });

  test('returns 503 when database health check fails', async () => {
    prismaMock.$queryRaw.mockRejectedValueOnce(new Error('db down'));

    const response = await request(makeApp()).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body.success).toBe(true);
    expect(response.body.data.database).toBe('disconnected');
    expect(response.body.data.status).toBe('degraded');
  });
});
