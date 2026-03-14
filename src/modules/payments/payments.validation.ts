import { z } from 'zod';

export const paymentOrderParamSchema = z.object({
  orderId: z.string().uuid(),
});

export const paymentWebhookSchema = z.object({
  orderCode: z.string().min(1),
  transactionCode: z.string().min(1),
  amount: z.coerce.number().positive(),
  status: z.enum(['paid', 'failed']),
});
