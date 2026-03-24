import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  book: {
    count: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  category: { findUnique: vi.fn() },
  author: { findUnique: vi.fn() },
  publisher: { findUnique: vi.fn() },
  bookImage: {
    aggregate: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock('../../src/shared/prisma/index.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../../src/shared/middleware/index.js', async () => {
  const actual = await vi.importActual<typeof import('../../src/shared/middleware/index.js')>('../../src/shared/middleware/index.js');

  return {
    ...actual,
    optionalAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
      if (req.headers.authorization === 'Bearer admin') {
        (req as unknown as Record<string, unknown>)['user'] = { userId: 'admin-1', role: 'admin' };
      }
      next();
    },
    authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
      (req as unknown as Record<string, unknown>)['user'] = { userId: 'admin-1', role: 'admin' };
      next();
    },
    authorize: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  };
});

const { globalErrorHandler } = await import('../../src/shared/errors/index.js');
const booksRoutes = (await import('../../src/modules/books/books.routes.js')).default;

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', booksRoutes);
  app.use(globalErrorHandler);
  return app;
}

describe('books routes public/admin contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.book.count.mockResolvedValue(1);
    prismaMock.book.findUnique.mockResolvedValue(null);
    prismaMock.category.findUnique.mockResolvedValue({ id: 'category-1' });
    prismaMock.author.findUnique.mockResolvedValue({ id: 'author-1' });
    prismaMock.publisher.findUnique.mockResolvedValue({ id: 'publisher-1' });
  });

  test('keeps anonymous listings on active books and trims internal fields', async () => {
    prismaMock.book.findMany.mockResolvedValue([
      {
        id: 'book-1',
        title: 'Public Book',
        price: 100000,
        stockQuantity: 5,
        status: 'active',
      },
    ]);

    const response = await request(makeApp()).get('/api/books?status=discontinued');

    expect(response.status).toBe(200);
    expect(response.body.data[0].importPrice).toBeUndefined();
    expect(response.body.data[0].categoryId).toBeUndefined();
    expect(prismaMock.book.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: 'active' }),
      select: expect.any(Object),
    }));
  });

  test('lets admin listings request non-active books without trimming admin fields', async () => {
    prismaMock.book.findMany.mockResolvedValue([
      {
        id: 'book-2',
        title: 'Admin Book',
        importPrice: 50000,
        categoryId: 'category-1',
        status: 'discontinued',
      },
    ]);

    const response = await request(makeApp())
      .get('/api/books?status=discontinued')
      .set('Authorization', 'Bearer admin');

    expect(response.status).toBe(200);
    expect(response.body.data[0].importPrice).toBe(50000);
    expect(prismaMock.book.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: 'discontinued' }),
      include: expect.any(Object),
    }));
  });

  test('returns 400 when admin creates a book with an unknown category', async () => {
    prismaMock.category.findUnique.mockResolvedValue(null);

    const response = await request(makeApp())
      .post('/api/books')
      .set('Authorization', 'Bearer admin')
      .send({
        title: 'Broken Book',
        slug: 'broken-book',
        price: 100000,
        categoryId: '7c0fdd16-7c36-4c81-84c7-13098bf4183f',
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('BAD_REQUEST');
    expect(response.body.error.message).toBe('Category not found');
    expect(prismaMock.book.create).not.toHaveBeenCalled();
  });
});
