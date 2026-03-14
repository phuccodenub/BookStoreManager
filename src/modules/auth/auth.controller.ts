import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as authService from './auth.service.js';
import { sendSuccess, sendCreated } from '../../shared/http/index.js';
import { log as logActivity } from '../activity-logs/activity-logs.service.js';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.register(req.body);
    sendCreated(res, user, 'Registration successful');
  } catch (err) { next(err); }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body);
    void logActivity({
      userId: result.user.id,
      action: 'login',
      entityType: 'auth',
      entityId: result.user.id,
      req,
    }).catch(() => undefined);
    sendSuccess(res, result, 'Login successful');
  } catch (err) { next(err); }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    sendSuccess(res, result, 'Token refreshed');
  } catch (err) { next(err); }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.logout(req.body.refreshToken);
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
