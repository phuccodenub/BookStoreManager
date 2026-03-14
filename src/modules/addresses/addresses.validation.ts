import { z } from 'zod';

export const createAddressSchema = z.object({
  receiverName: z.string().min(1).max(120),
  receiverPhone: z.string().min(1).max(20),
  province: z.string().min(1).max(100),
  district: z.string().min(1).max(100),
  ward: z.string().min(1).max(100),
  detailAddress: z.string().min(1).max(300),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = createAddressSchema.partial();

export const idParamSchema = z.object({ id: z.string().uuid() });
