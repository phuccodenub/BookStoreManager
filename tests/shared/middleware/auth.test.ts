import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
}));

const envMock = vi.hoisted(() => ({
  env: {
    JWT_ACCESS_SECRET: 'access-secret-that-is-long-enough',
  },
}));

vi.mock('../../../src/shared/prisma/index.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../../../src/shared/config/index.js', () => envMock);

const authMiddleware = await import('../../../src/shared/middleware/auth.js');

describe('shared auth middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('authenticate reloads the current role from the database', async () => {
    const token = jwt.sign(
      { userId: 'user-1', role: 'admin' },
      envMock.env.JWT_ACCESS_SECRET,
    );
    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as never;
    const next = vi.fn();

    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'customer',
      status: 'active',
    });

    await authMiddleware.authenticate(req, {} as never, next);

    expect((req as Record<string, unknown>)['user']).toEqual({
      userId: 'user-1',
      role: 'customer',
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('authenticate rejects locked accounts even if the JWT is valid', async () => {
    const token = jwt.sign(
      { userId: 'user-1', role: 'admin' },
      envMock.env.JWT_ACCESS_SECRET,
    );

    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'admin',
      status: 'locked',
    });

    await expect(
      Promise.resolve().then(() =>
        authMiddleware.authenticate(
          { headers: { authorization: `Bearer ${token}` } } as never,
          {} as never,
          vi.fn(),
        ),
      ),
    ).rejects.toThrow('Account is locked');
  });

  test('optionalAuth rethrows unexpected lookup failures', async () => {
    const token = jwt.sign(
      { userId: 'user-1', role: 'admin' },
      envMock.env.JWT_ACCESS_SECRET,
    );

    prismaMock.user.findUnique.mockRejectedValue(new Error('database unavailable'));

    await expect(
      authMiddleware.optionalAuth(
        { headers: { authorization: `Bearer ${token}` } } as never,
        {} as never,
        vi.fn(),
      ),
    ).rejects.toThrow('database unavailable');
  });
});
