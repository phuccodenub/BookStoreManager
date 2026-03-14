import { z } from 'zod';

export const homeQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(20).default(8),
});
