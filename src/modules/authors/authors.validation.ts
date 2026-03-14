import { z } from 'zod';
export const createAuthorSchema = z.object({
  name: z.string().min(1).max(150),
  bio: z.string().optional(),
  status: z.boolean().optional(),
});
export const updateAuthorSchema = createAuthorSchema.partial();
export const idParam = z.object({ id: z.string().uuid() });
export const listQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});
