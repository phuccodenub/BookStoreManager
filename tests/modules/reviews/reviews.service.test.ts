import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  order: {
    findFirst: vi.fn(),
  },
  review: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../../src/shared/prisma/index.js', () => ({
  prisma: prismaMock,
}));

const reviewsService = await import('../../../src/modules/reviews/reviews.service.js');

describe('reviews.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('creates a review only for completed orders containing the book', async () => {
    prismaMock.order.findFirst.mockResolvedValue({
      id: 'order-1',
      items: [{ bookId: 'book-1' }],
    });
    prismaMock.review.findUnique.mockResolvedValue(null);
    prismaMock.review.create.mockResolvedValue({ id: 'review-1', rating: 5 });

    const result = await reviewsService.create('user-1', {
      bookId: 'book-1',
      orderId: 'order-1',
      rating: 5,
      comment: 'Great book',
    });

    expect(result.id).toBe('review-1');
  });

  test('rejects updating another customer review', async () => {
    prismaMock.review.findUnique.mockResolvedValue({
      id: 'review-1',
      userId: 'user-2',
    });

    await expect(
      reviewsService.update('review-1', { userId: 'user-1', role: 'customer' }, { rating: 4 }),
    ).rejects.toThrow('Cannot update this review');
  });

  test('allows admins to delete any review', async () => {
    prismaMock.review.findUnique.mockResolvedValue({
      id: 'review-1',
      userId: 'user-2',
    });
    prismaMock.review.delete.mockResolvedValue({ id: 'review-1' });

    await expect(
      reviewsService.remove('review-1', { userId: 'admin-1', role: 'admin' }),
    ).resolves.toBeUndefined();
    expect(prismaMock.review.delete).toHaveBeenCalledWith({ where: { id: 'review-1' } });
  });
});
