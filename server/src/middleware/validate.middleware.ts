import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';

// Express 5 expose req.query via un getter sur le prototype : il n'est plus
// possible d'y ecrire (`Object.assign(req.query, ...)` est silencieusement
// no-op). On stocke donc les valeurs validees / coerced par Zod sur une
// propriete dediee req.validated, et les handlers les lisent depuis la.
declare module 'express-serve-static-core' {
  interface Request {
    validated?: {
      body?: unknown;
      query?: unknown;
      params?: unknown;
    };
  }
}

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.validated = req.validated ?? {};
      if (schemas.params) {
        const parsed = schemas.params.parse(req.params);
        req.validated.params = parsed;
        // req.params reste mutable en Express 5, on le synchronise pour
        // garder retrocompatible les handlers qui lisent req.params.X
        req.params = parsed as typeof req.params;
      }
      if (schemas.query) {
        // Pour query : on ne touche pas a req.query (immuable), seul
        // req.validated.query expose les defauts/coercions Zod.
        req.validated.query = schemas.query.parse(req.query);
      }
      if (schemas.body) {
        const parsed = schemas.body.parse(req.body);
        req.validated.body = parsed;
        req.body = parsed;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues.map((e: ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
        res.status(400).json({ error: message });
        return;
      }
      next(err);
    }
  };
}
