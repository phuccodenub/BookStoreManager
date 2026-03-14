import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
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
    prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
    prismaMock.refreshToken.create.mockResolvedValue({ id: 'token-1' });
    prismaMock.user.update.mockResolvedValue({ id: 'user-1' });
    bcryptMock.default.hash.mockResolvedValue('hashed-password');
    envMock.env.DEBUG_LOG_RESET_TOKENS = false;
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
});
