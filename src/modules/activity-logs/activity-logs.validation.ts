import { z } from 'zod';

export const activityLogQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  userId: z.string().uuid().optional(),
  entityType: z.string().optional(),
  action: z.string().optional(),
});
