import { beforeEach, describe, expect, test, vi } from 'vitest';

const booksServiceMock = vi.hoisted(() => ({
  updateCover: vi.fn(),
  addImages: vi.fn(),
  removeImage: vi.fn(),
}));

const storageMock = vi.hoisted(() => ({
  deleteUploadedFile: vi.fn(),
  fileUrl: vi.fn((filename: string) => `http://localhost:4000/uploads/${filename}`),
}));

const httpMock = vi.hoisted(() => ({
  buildPaginationMeta: vi.fn(),
  param: vi.fn((_req: unknown, key: string) => (key === 'imageId' ? 'image-1' : 'book-1')),
  sendCreated: vi.fn(),
  sendNoContent: vi.fn(),
  sendSuccess: vi.fn(),
}));

vi.mock('../../../src/modules/books/books.service.js', () => booksServiceMock);
vi.mock('../../../src/shared/storage/index.js', () => storageMock);
vi.mock('../../../src/shared/http/index.js', () => httpMock);

const booksController = await import('../../../src/modules/books/books.controller.js');

describe('books.controller upload cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storageMock.deleteUploadedFile.mockResolvedValue(undefined);
  });

  test('uploadCover removes the saved file when the service fails', async () => {
    const error = new Error('Book not found');
    booksServiceMock.updateCover.mockRejectedValue(error);
    const next = vi.fn();

    await booksController.uploadCover(
      { file: { filename: 'cover.png' } } as never,
      {} as never,
      next,
    );

    expect(storageMock.deleteUploadedFile).toHaveBeenCalledWith('cover.png');
    expect(next).toHaveBeenCalledWith(error);
  });

  test('uploadImages removes all saved files when the service fails', async () => {
    const error = new Error('Book not found');
    booksServiceMock.addImages.mockRejectedValue(error);
    const next = vi.fn();

    await booksController.uploadImages(
      {
        files: [{ filename: 'one.png' }, { filename: 'two.png' }],
      } as never,
      {} as never,
      next,
    );

    expect(storageMock.deleteUploadedFile).toHaveBeenCalledTimes(2);
    expect(storageMock.deleteUploadedFile).toHaveBeenCalledWith('one.png');
    expect(storageMock.deleteUploadedFile).toHaveBeenCalledWith('two.png');
    expect(next).toHaveBeenCalledWith(error);
  });
});
