import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  book: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  category: { findUnique: vi.fn() },
  author: { findUnique: vi.fn() },
  publisher: { findUnique: vi.fn() },
  bookImage: {
    findUnique: vi.fn(),
    aggregate: vi.fn(),
    delete: vi.fn(),
  },
  $transaction: vi.fn(),
}));

const storageMock = vi.hoisted(() => ({
  deleteUploadedFile: vi.fn(),
}));

vi.mock('../../../src/shared/prisma/index.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../../../src/shared/storage/index.js', () => storageMock);

const booksService = await import('../../../src/modules/books/books.service.js');

describe('books.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.book.findUnique.mockResolvedValue(null);
    prismaMock.book.count.mockResolvedValue(1);
    prismaMock.book.create.mockResolvedValue({ id: 'book-1' });
    prismaMock.book.update.mockResolvedValue({ id: 'book-1' });
    prismaMock.category.findUnique.mockResolvedValue({ id: 'category-1' });
    prismaMock.author.findUnique.mockResolvedValue({ id: 'author-1' });
    prismaMock.publisher.findUnique.mockResolvedValue({ id: 'publisher-1' });
  });

  test('forces public book listings to active status and trims internal fields', async () => {
    prismaMock.book.findMany.mockResolvedValue([{ id: 'book-1', title: 'Public Book' }]);

    await booksService.list({ page: 1, limit: 12, status: 'discontinued' });

    const call = prismaMock.book.findMany.mock.calls[0]?.[0];
    expect(call.where.status).toBe('active');
    expect(call.select).toMatchObject({
      id: true,
      title: true,
      price: true,
      stockQuantity: true,
      images: expect.objectContaining({
        select: expect.objectContaining({ imageUrl: true }),
      }),
    });
    expect(call.select.importPrice).toBeUndefined();
    expect(call.select.categoryId).toBeUndefined();
    expect(call.include).toBeUndefined();
  });

  test('lets admin listings request non-active books without switching to the public projection', async () => {
    prismaMock.book.findMany.mockResolvedValue([{ id: 'book-1', title: 'Admin Book' }]);

    await booksService.list({ page: 1, limit: 12, status: 'discontinued' }, 'admin');

    const call = prismaMock.book.findMany.mock.calls[0]?.[0];
    expect(call.where.status).toBe('discontinued');
    expect(call.include).toBeDefined();
    expect(call.select).toBeUndefined();
  });

  test('falls back to best-selling active books when category/author matches return no data', async () => {
    prismaMock.book.findFirst.mockResolvedValue({
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

  test('rejects book creation when a related category does not exist', async () => {
    prismaMock.category.findUnique.mockResolvedValue(null);

    await expect(
      booksService.create({
        title: 'Book',
        slug: 'book',
        price: 100000,
        categoryId: 'missing-category',
      }),
    ).rejects.toThrow('Category not found');

    expect(prismaMock.book.create).not.toHaveBeenCalled();
  });

  test('rejects book creation when the slug already exists', async () => {
    prismaMock.book.findUnique.mockResolvedValueOnce({ id: 'existing-book' });

    await expect(
      booksService.create({
        title: 'Book',
        slug: 'existing-slug',
        price: 100000,
      }),
    ).rejects.toThrow('Slug already exists');

    expect(prismaMock.book.create).not.toHaveBeenCalled();
  });

  test('rejects removing an image that belongs to a different book', async () => {
    prismaMock.bookImage.findUnique.mockResolvedValue({
      id: 'image-1',
      bookId: 'book-2',
      imageUrl: 'http://localhost:4000/uploads/image-1.png',
    });

    await expect(booksService.removeImage('book-1', 'image-1')).rejects.toThrow(
      'Image does not belong to this book',
    );

    expect(prismaMock.bookImage.delete).not.toHaveBeenCalled();
    expect(storageMock.deleteUploadedFile).not.toHaveBeenCalled();
  });
});
