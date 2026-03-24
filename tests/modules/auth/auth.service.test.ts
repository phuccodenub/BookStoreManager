import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(),
  user: {
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  },
  refreshToken: {
    create: vi.fn(),
    deleteMany: vi.fn(),
    findFirst: vi.fn(),
  },
}));

const txMock = vi.hoisted(() => ({
  refreshToken: {
    create: vi.fn(),
    deleteMany: vi.fn(),
    findFirst: vi.fn(),
  },
}));

const bcryptMock = vi.hoisted(() => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

const envMock = vi.hoisted(() => ({
  env: {
    NODE_ENV: 'test',
    JWT_ACCESS_SECRET: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    JWT_REFRESH_SECRET: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
    DEBUG_LOG_RESET_TOKENS: false,
  },
}));

const loggerMock = vi.hoisted(() => ({
  logger: {
    warn: vi.fn(),
  },
}));

vi.mock('../../../src/shared/prisma/index.js', () => ({
  prisma: prismaMock,
}));

vi.mock('bcryptjs', () => bcryptMock);
vi.mock('../../../src/shared/config/index.js', () => envMock);
vi.mock('../../../src/shared/logger/index.js', () => loggerMock);

const authService = await import('../../../src/modules/auth/auth.service.js');

describe('auth.service session invalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof txMock) => Promise<unknown>) => callback(txMock));
    prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
    prismaMock.refreshToken.create.mockResolvedValue({ id: 'token-1' });
    prismaMock.user.update.mockResolvedValue({ id: 'user-1' });
    txMock.refreshToken.findFirst.mockReset();
    txMock.refreshToken.deleteMany.mockReset();
    txMock.refreshToken.create.mockReset();
    txMock.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
    bcryptMock.default.hash.mockResolvedValue('hashed-password');
    envMock.env.DEBUG_LOG_RESET_TOKENS = false;
    envMock.env.NODE_ENV = 'test';
  });

  test('changePassword revokes refresh tokens for the user', async () => {
    prismaMock.user.findUniqueOrThrow.mockResolvedValue({
      id: 'user-1',
      passwordHash: 'old-hash',
    });
    bcryptMock.default.compare.mockResolvedValue(true);

    await authService.changePassword('user-1', {
      currentPassword: 'old-password',
      newPassword: 'NewPassword123!',
    });

    expect(prismaMock.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
  });

  test('resetPassword revokes all user tokens after password reset', async () => {
    prismaMock.refreshToken.findFirst.mockResolvedValue({
      id: 'token-1',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 60_000),
    });

    await authService.resetPassword('reset-token', 'NewPassword123!');

    expect(prismaMock.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
  });

  test('forgotPassword does not log raw reset tokens by default', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    });

    await authService.forgotPassword('User@Example.com');

    expect(loggerMock.logger.warn).not.toHaveBeenCalled();
  });

  test('refresh returns unauthorized when the token was already consumed by a concurrent request', async () => {
    txMock.refreshToken.findFirst.mockResolvedValue({
      id: 'token-1',
      tokenHash: 'hash-1',
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: 'user-1', role: 'customer', status: 'active' },
    });
    txMock.refreshToken.deleteMany.mockResolvedValueOnce({ count: 0 });

    await expect(authService.refresh('refresh-token')).rejects.toThrow(
      'Invalid or expired refresh token',
    );

    expect(txMock.refreshToken.create).not.toHaveBeenCalled();
  });

  test('forgotPassword logs a usable reset token in development when debug logging is enabled', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    });
    envMock.env.NODE_ENV = 'development';
    envMock.env.DEBUG_LOG_RESET_TOKENS = true;

    await authService.forgotPassword('User@Example.com');

    expect(loggerMock.logger.warn).toHaveBeenCalledTimes(1);
    const firstWarnCall = loggerMock.logger.warn.mock.calls[0];
    expect(firstWarnCall).toBeDefined();
    const resetToken = (firstWarnCall?.[0] as { resetToken: string }).resetToken;
    const createArgs = prismaMock.refreshToken.create.mock.calls[0]?.[0];
    const expectedHash = createHash('sha256').update(resetToken).digest('hex');

    expect(createArgs).toEqual({
      data: expect.objectContaining({
        userId: 'user-1',
        tokenHash: `reset:${expectedHash}`,
      }),
    });
  });
});
