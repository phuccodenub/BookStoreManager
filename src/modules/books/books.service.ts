import { prisma } from '../../shared/prisma/index.js';
import { AppError } from '../../shared/errors/index.js';
import { deleteUploadedFile } from '../../shared/storage/index.js';
import { BookStatus, Role } from '../../shared/constants/index.js';
import { Prisma } from '@prisma/client';
import type { BookStatus as BookStatusValue } from '../../shared/constants/index.js';

const adminBookInclude = Prisma.validator<Prisma.BookInclude>()({
  category: { select: { id: true, name: true, slug: true } },
  author: { select: { id: true, name: true } },
  publisher: { select: { id: true, name: true } },
  images: { orderBy: { sortOrder: 'asc' as const } },
});

const publicBookSelect = Prisma.validator<Prisma.BookSelect>()({
  id: true,
  title: true,
  slug: true,
  coverImage: true,
  price: true,
  stockQuantity: true,
  status: true,
  isFeatured: true,
  isNew: true,
  isBestSeller: true,
  description: true,
  publicationYear: true,
  pageCount: true,
  category: { select: { id: true, name: true, slug: true } },
  author: { select: { id: true, name: true } },
  publisher: { select: { id: true, name: true } },
  images: {
    select: { id: true, imageUrl: true, sortOrder: true },
    orderBy: { sortOrder: 'asc' as const },
  },
});

type ListQuery = {
  page: number; limit: number; search?: string;
  categoryId?: string; authorId?: string; publisherId?: string;
  status?: BookStatusValue; isFeatured?: boolean; isNew?: boolean; isBestSeller?: boolean;
  minPrice?: number; maxPrice?: number; sortBy?: string;
};

function isPrivilegedViewer(role?: string): boolean {
  return role === Role.ADMIN || role === Role.STAFF;
}

async function validateBookRelations(data: Record<string, unknown>) {
  const relationChecks: Promise<void>[] = [];

  if (typeof data.categoryId === 'string') {
    relationChecks.push(
      prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } }).then((category) => {
        if (!category) throw AppError.badRequest('Category not found');
      }),
    );
  }

  if (typeof data.authorId === 'string') {
    relationChecks.push(
      prisma.author.findUnique({ where: { id: data.authorId }, select: { id: true } }).then((author) => {
        if (!author) throw AppError.badRequest('Author not found');
      }),
    );
  }

  if (typeof data.publisherId === 'string') {
    relationChecks.push(
      prisma.publisher.findUnique({ where: { id: data.publisherId }, select: { id: true } }).then((publisher) => {
        if (!publisher) throw AppError.badRequest('Publisher not found');
      }),
    );
  }

  await Promise.all(relationChecks);
}

async function ensureUniqueBookFields(data: Record<string, unknown>, currentBookId?: string) {
  const uniqueChecks: Promise<void>[] = [];

  if (typeof data.slug === 'string') {
    uniqueChecks.push(
      prisma.book.findUnique({ where: { slug: data.slug }, select: { id: true } }).then((book) => {
        if (book && book.id !== currentBookId) throw AppError.conflict('Slug already exists');
      }),
    );
  }

  if (typeof data.isbn === 'string' && data.isbn.length > 0) {
    uniqueChecks.push(
      prisma.book.findUnique({ where: { isbn: data.isbn }, select: { id: true } }).then((book) => {
        if (book && book.id !== currentBookId) throw AppError.conflict('ISBN already exists');
      }),
    );
  }

  await Promise.all(uniqueChecks);
}

export async function list(q: ListQuery, viewerRole?: string) {
  const privilegedViewer = isPrivilegedViewer(viewerRole);
  const where: Prisma.BookWhereInput = {};

  if (q.search) {
    where.OR = [
      { title: { contains: q.search, mode: 'insensitive' } },
      { isbn: { contains: q.search, mode: 'insensitive' } },
      { author: { name: { contains: q.search, mode: 'insensitive' } } },
    ];
  }
  if (q.categoryId) where.categoryId = q.categoryId;
  if (q.authorId) where.authorId = q.authorId;
  if (q.publisherId) where.publisherId = q.publisherId;
  if (privilegedViewer) {
    if (q.status) where.status = q.status as never;
  } else {
    where.status = BookStatus.ACTIVE;
  }
  if (q.isFeatured !== undefined) where.isFeatured = q.isFeatured;
  if (q.isNew !== undefined) where.isNew = q.isNew;
  if (q.isBestSeller !== undefined) where.isBestSeller = q.isBestSeller;
  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    where.price = {};
    if (q.minPrice !== undefined) where.price.gte = q.minPrice;
    if (q.maxPrice !== undefined) where.price.lte = q.maxPrice;
  }

  let orderBy: Prisma.BookOrderByWithRelationInput = { createdAt: 'desc' };
  switch (q.sortBy) {
    case 'price_asc':    orderBy = { price: 'asc' }; break;
    case 'price_desc':   orderBy = { price: 'desc' }; break;
    case 'newest':       orderBy = { createdAt: 'desc' }; break;
    case 'best_seller':  orderBy = { soldQuantity: 'desc' }; break;
  }

  const [items, total] = privilegedViewer
    ? await Promise.all([
        prisma.book.findMany({ where, include: adminBookInclude, skip: (q.page - 1) * q.limit, take: q.limit, orderBy }),
        prisma.book.count({ where }),
      ])
    : await Promise.all([
        prisma.book.findMany({ where, select: publicBookSelect, skip: (q.page - 1) * q.limit, take: q.limit, orderBy }),
        prisma.book.count({ where }),
      ]);

  return { items, total };
}

export async function getById(id: string, viewerRole?: string) {
  const book = isPrivilegedViewer(viewerRole)
    ? await prisma.book.findUnique({ where: { id }, include: adminBookInclude })
    : await prisma.book.findFirst({ where: { id, status: BookStatus.ACTIVE }, select: publicBookSelect });

  if (!book) throw AppError.notFound('Book');
  return book;
}

export async function listRelated(id: string, limit: number, viewerRole?: string) {
  const current = await prisma.book.findFirst({
    where: isPrivilegedViewer(viewerRole) ? { id } : { id, status: BookStatus.ACTIVE },
    select: { id: true, categoryId: true, authorId: true },
  });
  if (!current) throw AppError.notFound('Book');

  const related = await prisma.book.findMany({
    where: {
      id: { not: id },
      status: 'active',
      OR: [
        current.categoryId ? { categoryId: current.categoryId } : undefined,
        current.authorId ? { authorId: current.authorId } : undefined,
      ].filter(Boolean) as Prisma.BookWhereInput[],
    },
    select: publicBookSelect,
    orderBy: [{ soldQuantity: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  });

  if (related.length > 0) return related;

  return prisma.book.findMany({
    where: { id: { not: id }, status: 'active' },
    select: publicBookSelect,
    orderBy: [{ soldQuantity: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  });
}

export async function getBySlug(slug: string, viewerRole?: string) {
  const book = isPrivilegedViewer(viewerRole)
    ? await prisma.book.findUnique({ where: { slug }, include: adminBookInclude })
    : await prisma.book.findFirst({ where: { slug, status: BookStatus.ACTIVE }, select: publicBookSelect });

  if (!book) throw AppError.notFound('Book');
  return book;
}

export async function create(data: Record<string, unknown>) {
  await Promise.all([validateBookRelations(data), ensureUniqueBookFields(data)]);
  return prisma.book.create({ data: data as never, include: adminBookInclude });
}

export async function update(id: string, data: Record<string, unknown>) {
  if (!(await prisma.book.findUnique({ where: { id } }))) throw AppError.notFound('Book');
  await Promise.all([validateBookRelations(data), ensureUniqueBookFields(data, id)]);
  return prisma.book.update({ where: { id }, data: data as never, include: adminBookInclude });
}

export async function remove(id: string) {
  if (!(await prisma.book.findUnique({ where: { id } }))) throw AppError.notFound('Book');
  await prisma.book.delete({ where: { id } });
}

export async function updateCover(id: string, coverUrl: string) {
  if (!(await prisma.book.findUnique({ where: { id } }))) throw AppError.notFound('Book');
  return prisma.book.update({ where: { id }, data: { coverImage: coverUrl }, include: adminBookInclude });
}

export async function addImages(bookId: string, imageUrls: string[]) {
  if (!(await prisma.book.findUnique({ where: { id: bookId } }))) throw AppError.notFound('Book');
  const maxOrder = await prisma.bookImage.aggregate({ where: { bookId }, _max: { sortOrder: true } });
  let nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;
  const images = await prisma.$transaction(
    imageUrls.map((url) => prisma.bookImage.create({ data: { bookId, imageUrl: url, sortOrder: nextOrder++ } })),
  );
  return images;
}

export async function removeImage(bookId: string, imageId: string) {
  const image = await prisma.bookImage.findUnique({ where: { id: imageId } });
  if (!image) throw AppError.notFound('BookImage');
  if (image.bookId !== bookId) throw AppError.badRequest('Image does not belong to this book');
  await prisma.bookImage.delete({ where: { id: imageId } });
  await deleteUploadedFile(image.imageUrl).catch(() => undefined);
}
