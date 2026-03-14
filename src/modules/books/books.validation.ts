import { z } from 'zod';

export const createBookSchema = z.object({
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(350),
  isbn: z.string().max(20).optional(),
  description: z.string().optional(),
  publicationYear: z.coerce.number().int().optional(),
  pageCount: z.coerce.number().int().positive().optional(),
  price: z.coerce.number().nonnegative(),
  importPrice: z.coerce.number().nonnegative().optional(),
  stockQuantity: z.coerce.number().int().nonnegative().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  authorId: z.string().uuid().nullable().optional(),
  publisherId: z.string().uuid().nullable().optional(),
  status: z.enum(['active', 'out_of_stock', 'discontinued']).optional(),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
});

export const updateBookSchema = createBookSchema.partial();

export const idParam = z.object({ id: z.string().uuid() });

export const relatedQuery = z.object({
  limit: z.coerce.number().int().positive().max(20).default(8),
});

export const listQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  authorId: z.string().uuid().optional(),
  publisherId: z.string().uuid().optional(),
  status: z.enum(['active', 'out_of_stock', 'discontinued']).optional(),
  isFeatured: z.coerce.boolean().optional(),
  isNew: z.coerce.boolean().optional(),
  isBestSeller: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'newest', 'best_seller']).optional(),
});
