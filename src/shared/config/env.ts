import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  APP_BASE_URL: z.string().url().default('http://localhost:4000'),
  UPLOAD_DIR: z.string().default('uploads'),
  DEFAULT_SHIPPING_FEE: z.coerce.number().nonnegative().default(25000),
  LOW_STOCK_THRESHOLD: z.coerce.number().int().nonnegative().default(5),
  PAYMENT_WEBHOOK_SECRET: z.string().min(16).optional(),
  DEBUG_LOG_RESET_TOKENS: z.coerce.boolean().default(false),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(rawEnv: NodeJS.ProcessEnv): Env {
  const parsed = envSchema.safeParse(rawEnv);
  if (!parsed.success) {
    throw new Error(JSON.stringify(parsed.error.flatten().fieldErrors));
  }

  const data = parsed.data;
  if (data.NODE_ENV !== 'test' && !data.PAYMENT_WEBHOOK_SECRET) {
    throw new Error('PAYMENT_WEBHOOK_SECRET is required outside test environments');
  }

  return data;
}

let parsedEnv: Env;

try {
  parsedEnv = parseEnv(process.env);
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown env error';
  console.error('Invalid environment variables:', message);
  process.exit(1);
}

export const env: Env = parsedEnv;
