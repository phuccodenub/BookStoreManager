import express from 'express';
import request from 'supertest';
import { Prisma } from '@prisma/client';
import { describe, expect, test } from 'vitest';
import { globalErrorHandler } from '../../../src/shared/errors/index.js';

function makeApp(error: unknown) {
  const app = express();
  app.get('/boom', (_req, _res, next) => next(error));
  app.use(globalErrorHandler);
  return app;
}

describe('globalErrorHandler Prisma mappings', () => {
  test('maps unique constraint violations to 409 conflict', async () => {
    const app = makeApp(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        clientVersion: 'test',
        code: 'P2002',
        meta: { target: ['slug'] },
      }),
    );

    const response = await request(app).get('/boom');

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('CONFLICT');
    expect(response.body.error.message).toBe('Duplicate value for slug');
  });

  test('maps foreign key violations to 400 bad request', async () => {
    const app = makeApp(
      new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
        clientVersion: 'test',
        code: 'P2003',
      }),
    );

    const response = await request(app).get('/boom');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('BAD_REQUEST');
    expect(response.body.error.message).toBe('Referenced resource does not exist');
  });

  test('maps record-not-found errors to 404', async () => {
    const app = makeApp(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        clientVersion: 'test',
        code: 'P2025',
      }),
    );

    const response = await request(app).get('/boom');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.message).toBe('Resource not found');
  });
});
