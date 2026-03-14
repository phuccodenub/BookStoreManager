import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(150),
  description: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
  status: z.boolean().optional(),
});
export const updateCategorySchema = createCategorySchema.partial();
export const idParam = z.object({ id: z.string().uuid() });
export const listQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  parentId: z.string().uuid().optional(),
});
