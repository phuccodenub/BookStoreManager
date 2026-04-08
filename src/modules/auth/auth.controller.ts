import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as authService from './auth.service.js';
import { sendSuccess, sendCreated } from '../../shared/http/index.js';
import { log as logActivity } from '../activity-logs/activity-logs.service.js';
import { env } from '../../shared/config/index.js';

const REFRESH_COOKIE_NAME = 'bookstore_refresh';

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

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/api/auth',
    maxAge: parseDuration(env.JWT_REFRESH_EXPIRES_IN),
  };
}

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getCookieOptions());
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...getCookieOptions(),
    maxAge: undefined,
  });
}

function readCookie(req: Request, key: string) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(';')) {
    const [rawName, ...rawValue] = part.trim().split('=');
    if (rawName === key) {
      return decodeURIComponent(rawValue.join('='));
    }
  }

  return null;
}

function resolveRefreshToken(req: Request) {
  const bodyToken = (req.body as { refreshToken?: string } | undefined)?.refreshToken;
  return readCookie(req, REFRESH_COOKIE_NAME) ?? bodyToken ?? null;
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.register(req.body);
    sendCreated(res, user, 'Registration successful');
  } catch (err) { next(err); }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body);
    setRefreshCookie(res, result.refreshToken);
    void logActivity({
      userId: result.user.id,
      action: 'login',
      entityType: 'auth',
      entityId: result.user.id,
      req,
    }).catch(() => undefined);
    sendSuccess(res, {
      accessToken: result.accessToken,
      user: result.user,
    }, 'Login successful');
  } catch (err) { next(err); }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = resolveRefreshToken(req);
    if (!refreshToken) {
      clearRefreshCookie(res);
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: { code: 'NO_REFRESH_TOKEN', message: 'Missing refresh token' },
      });
      return;
    }

    const result = await authService.refresh(refreshToken);
    setRefreshCookie(res, result.refreshToken);
    sendSuccess(res, { accessToken: result.accessToken }, 'Token refreshed');
  } catch (err) { next(err); }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = resolveRefreshToken(req);
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    clearRefreshCookie(res);
    sendSuccess(res, null, 'Logged out');
  } catch (err) { next(err); }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = ((req as unknown as Record<string, unknown>)['user'] as { userId: string }).userId;
    await authService.changePassword(userId, req.body);
    void logActivity({
      userId,
      action: 'change_password',
      entityType: 'auth',
      entityId: userId,
      req,
    }).catch(() => undefined);
    sendSuccess(res, null, 'Password changed');
  } catch (err) { next(err); }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.forgotPassword(req.body.email);
    sendSuccess(res, null, 'If the email exists, a reset link has been sent');
  } catch (err) { next(err); }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.resetPassword(req.body.token, req.body.newPassword);
    sendSuccess(res, null, 'Password reset successful');
  } catch (err) { next(err); }
}
