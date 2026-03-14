import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
}));

const bcryptMock = vi.hoisted(() => ({
  default: {
    hash: vi.fn(),
  },
}));

vi.mock('../../../src/shared/prisma/index.js', () => ({
  prisma: prismaMock,
}));

vi.mock('bcryptjs', () => bcryptMock);

const usersService = await import('../../../src/modules/users/users.service.js');

describe('users.service.adminCreateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bcryptMock.default.hash.mockResolvedValue('hashed-password');
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: 'user-1' });
  });

  test('normalizes admin-created email addresses to lowercase', async () => {
    await usersService.adminCreateUser({
      fullName: 'Alice Example',
      email: 'Alice@Example.com',
      phone: '0123456789',
      password: 'Password123!',
      role: 'staff',
    });

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'alice@example.com' },
    });
    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'alice@example.com',
        }),
      }),
    );
  });
});
