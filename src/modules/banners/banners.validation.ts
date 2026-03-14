import { z } from 'zod';
export const createBannerSchema = z.object({
  title: z.string().min(1).max(200),
  link: z.string().max(500).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});
export const updateBannerSchema = createBannerSchema.partial();
export const idParam = z.object({ id: z.string().uuid() });
