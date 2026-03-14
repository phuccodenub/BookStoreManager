import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  systemConfig: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
}));

vi.mock('../../../src/shared/prisma/index.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../../../src/shared/config/index.js', () => ({
  env: {
    DEFAULT_SHIPPING_FEE: 25000,
  },
}));

const settingsService = await import('../../../src/modules/settings/settings.service.js');

describe('settings.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns a fallback settings object when no config row exists', async () => {
    prismaMock.systemConfig.findUnique.mockResolvedValue(null);

    const result = await settingsService.getPublicSettings();

    expect(result.storeName).toBe('BookStoreManager');
    expect(result.shippingFee).toBe(25000);
  });

  test('upserts the singleton settings row', async () => {
    prismaMock.systemConfig.upsert.mockResolvedValue({
      id: 'default',
      storeName: 'BookStoreManager',
      shippingFee: 30000,
    });

    const result = await settingsService.updateSettings({ shippingFee: 30000 });

    expect(prismaMock.systemConfig.upsert).toHaveBeenCalled();
    expect(result.shippingFee).toBe(30000);
  });
});
