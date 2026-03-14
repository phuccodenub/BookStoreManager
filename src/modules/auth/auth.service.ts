import { randomUUID, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../shared/prisma/index.js';
import { env } from '../../shared/config/index.js';
import { AppError } from '../../shared/errors/index.js';
import { logger } from '../../shared/logger/index.js';
import type { JwtPayload } from '../../shared/middleware/index.js';
import type { RegisterInput, LoginInput, ChangePasswordInput } from './auth.validation.js';

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function signAccess(userId: string, role: string): string {
  return jwt.sign({ userId, role } satisfies JwtPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as unknown as number,
  });
}

function signRefresh(): { raw: string; hash: string; expiresAt: Date } {
  const raw = randomUUID();
  const hash = hashToken(raw);
  const ms = parseDuration(env.JWT_REFRESH_EXPIRES_IN);
  const expiresAt = new Date(Date.now() + ms);
  return { raw, hash, expiresAt };
}

function parseDuration(val: string): number {
  const match = /^(\d+)([smhd])$/.exec(val);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const n = Number(match[1]);
  switch (match[2]) {
    case 's': return n * 1000;
    case 'm': return n * 60_000;
    case 'h': return n * 3_600_000;
    case 'd': return n * 86_400_000;
    default: return 7 * 86_400_000;
  }
}

function maskToken(token: string): string {
  if (token.length <= 8) return '***';
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

export async function register(input: RegisterInput) {
  const email = input.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw AppError.conflict('Email already registered');

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email,
      phone: input.phone,
      passwordHash,
    },
    select: { id: true, fullName: true, email: true, role: true, status: true, createdAt: true },
  });

  return user;
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user) throw AppError.unauthorized('Invalid email or password');
  if (user.status === 'locked') throw AppError.forbidden('Account is locked');

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw AppError.unauthorized('Invalid email or password');

  const accessToken = signAccess(user.id, user.role);
  const refresh = signRefresh();

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: refresh.hash, expiresAt: refresh.expiresAt },
  });

  return {
    accessToken,
    refreshToken: refresh.raw,
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
  };
}

export async function refresh(rawRefreshToken: string) {
  const tokenHash = hashToken(rawRefreshToken);
  const stored = await prisma.refreshToken.findFirst({
    where: { tokenHash },
    include: { user: true },
  });

  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw AppError.unauthorized('Invalid or expired refresh token');
  }

  if (stored.user.status === 'locked') {
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw AppError.forbidden('Account is locked');
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const accessToken = signAccess(stored.user.id, stored.user.role);
  const newRefresh = signRefresh();

  await prisma.refreshToken.create({
    data: { userId: stored.user.id, tokenHash: newRefresh.hash, expiresAt: newRefresh.expiresAt },
  });

  return { accessToken, refreshToken: newRefresh.raw };
}

export async function logout(rawRefreshToken: string) {
  const tokenHash = hashToken(rawRefreshToken);
  await prisma.refreshToken.deleteMany({ where: { tokenHash } });
}

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!valid) throw AppError.badRequest('Current password is incorrect');

  const passwordHash = await bcrypt.hash(input.newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

export async function forgotPassword(email: string) {
  const normalizedEmail = email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return;

  const resetToken = randomUUID();
  if (env.DEBUG_LOG_RESET_TOKENS) {
    logger.warn({ email: normalizedEmail, resetToken: maskToken(resetToken) }, 'Mock password reset token generated');
  }

  const hash = hashToken(resetToken);
  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: `reset:${hash}`, expiresAt: new Date(Date.now() + 3_600_000) },
  });
}

export async function resetPassword(token: string, newPassword: string) {
  const hash = `reset:${hashToken(token)}`;
  const stored = await prisma.refreshToken.findFirst({ where: { tokenHash: hash } });
  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw AppError.badRequest('Invalid or expired reset token');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: stored.userId }, data: { passwordHash } });
  await prisma.refreshToken.deleteMany({ where: { userId: stored.userId } });
}
