import express from 'express';
import request from 'supertest';
import { describe, expect, test } from 'vitest';
import { globalErrorHandler } from '../../../src/shared/errors/index.js';

const { rateLimit } = await import('../../../src/shared/middleware/rate-limit.js');

describe('rateLimit middleware', () => {
  test('blocks repeated requests from the same client after the configured limit', async () => {
    const app = express();
    app.set('trust proxy', true);
    app.use(
      rateLimit({
        windowMs: 60_000,
        max: 2,
        message: 'Too many login attempts',
      }),
    );
    app.get('/login', (_req, res) => {
      res.status(200).json({ ok: true });
    });
    app.use(globalErrorHandler);

    await request(app).get('/login').set('X-Forwarded-For', '203.0.113.10').expect(200);
    await request(app).get('/login').set('X-Forwarded-For', '203.0.113.10').expect(200);

    const response = await request(app)
      .get('/login')
      .set('X-Forwarded-For', '203.0.113.10');

    expect(response.status).toBe(429);
    expect(response.body.error.message).toBe('Too many login attempts');
  });

  test('does not trust X-Forwarded-For when the app has not enabled proxy trust', async () => {
    const app = express();
    app.use(
      rateLimit({
        windowMs: 60_000,
        max: 1,
        message: 'Too many login attempts',
      }),
    );
    app.get('/login', (_req, res) => {
      res.status(200).json({ ok: true });
    });
    app.use(globalErrorHandler);

    await request(app).get('/login').set('X-Forwarded-For', '198.51.100.1').expect(200);

    const response = await request(app)
      .get('/login')
      .set('X-Forwarded-For', '198.51.100.2');

    expect(response.status).toBe(429);
    expect(response.body.error.message).toBe('Too many login attempts');
  });
});
