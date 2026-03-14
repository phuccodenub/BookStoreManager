import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  book: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  bookImage: {
    findUnique: vi.fn(),
    aggregate: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock('../../../src/shared/prisma/index.js', () => ({
  prisma: prismaMock,
}));

const booksService = await import('../../../src/modules/books/books.service.js');

describe('books.service.listRelated', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('falls back to best-selling active books when category/author matches return no data', async () => {
    prismaMock.book.findUnique.mockResolvedValue({
      id: 'book-1',
      categoryId: 'category-1',
      authorId: 'author-1',
    });
    prismaMock.book.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'book-2', title: 'Fallback book' }]);

    const result = await booksService.listRelated('book-1', 4);

    expect(prismaMock.book.findMany).toHaveBeenCalledTimes(2);
    expect(result[0]?.id).toBe('book-2');
  });
});
