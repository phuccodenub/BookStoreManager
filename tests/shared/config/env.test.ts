import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const baseEnv = {
  NODE_ENV: 'production',
  PORT: '4000',
  DATABASE_URL: 'https://example.com/db',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  APP_BASE_URL: 'http://localhost:4000',
  UPLOAD_DIR: 'uploads',
  DEFAULT_SHIPPING_FEE: '25000',
  LOW_STOCK_THRESHOLD: '5',
  PAYMENT_WEBHOOK_SECRET: 'c'.repeat(32),
};

describe('shared config env', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...baseEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  test('fails closed when PAYMENT_WEBHOOK_SECRET is missing outside tests', async () => {
    const mod = await import('../../../src/shared/config/env.js');

    expect(() =>
      mod.parseEnv({
        ...baseEnv,
        PAYMENT_WEBHOOK_SECRET: undefined,
      } as never),
    ).toThrow('PAYMENT_WEBHOOK_SECRET is required outside test environments');
  });

  test('allows PAYMENT_WEBHOOK_SECRET to be omitted in test mode', async () => {
    const mod = await import('../../../src/shared/config/env.js');

    expect(
      mod.parseEnv({
        ...baseEnv,
        NODE_ENV: 'test',
        PAYMENT_WEBHOOK_SECRET: undefined,
      } as never).PAYMENT_WEBHOOK_SECRET,
    ).toBeUndefined();
  });
});
