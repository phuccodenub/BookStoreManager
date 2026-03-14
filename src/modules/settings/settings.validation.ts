import { z } from 'zod';

export const updateSettingsSchema = z.object({
  storeName: z.string().min(1).max(200).optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().max(20).nullable().optional(),
  contactAddress: z.string().max(300).nullable().optional(),
  shippingFee: z.coerce.number().nonnegative().optional(),
  supportHours: z.string().max(200).nullable().optional(),
  paymentProviderName: z.string().max(120).nullable().optional(),
  paymentInstructions: z.string().max(2000).nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field must be provided',
});
