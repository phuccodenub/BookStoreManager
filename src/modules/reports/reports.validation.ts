import { z } from 'zod';

export const timeRangeQuery = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const topQuery = z.object({
  limit: z.coerce.number().int().positive().max(50).default(10),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
