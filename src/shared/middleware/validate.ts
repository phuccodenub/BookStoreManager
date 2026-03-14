import type { Request, Response, NextFunction } from 'express';
import { type AnyZodObject, type ZodEffects, ZodError } from 'zod';

type Schema = AnyZodObject | ZodEffects<AnyZodObject>;

interface ValidateTarget {
  body?: Schema;
  query?: Schema;
  params?: Schema;
}

/**
 * Express middleware that validates `req.body`, `req.query`, `req.params`
 * against the supplied Zod schemas and replaces them with the parsed result.
 */
export function validate(schemas: ValidateTarget) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        (req as unknown as Record<string, unknown>)['query'] = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        (req as unknown as Record<string, unknown>)['params'] = schemas.params.parse(req.params);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(err);        
      } else {
        next(err);
      }
    }
  };
}
