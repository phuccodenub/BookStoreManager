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
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation(((code?: number) => {
        throw new Error(`process.exit:${code ?? 0}`);
      }) as never);

    await expect(import('../../../src/shared/config/env.js')).rejects.toThrow('process.exit:1');

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('allows PAYMENT_WEBHOOK_SECRET to be omitted in test mode', async () => {
    process.env.NODE_ENV = 'test';

    const mod = await import('../../../src/shared/config/env.js');

    expect(mod.env.NODE_ENV).toBe('test');
    expect(mod.env.PAYMENT_WEBHOOK_SECRET).toBeUndefined();
  });
});
