// Helpers de route typée — Express + Zod avec inférence totale.
//
// Conçu pour Express 5 où req.query est immuable : les valeurs validées /
// coerced sont stockées sur req.validated et accessibles avec un typage
// complet inféré depuis le schéma Zod, sans cast manuel dans le handler.

import type { Response, NextFunction, RequestHandler } from "express";
import { ZodSchema, ZodError, ZodIssue, infer as ZInfer } from "zod";
import { AuthRequest } from "./keycloak-auth";
import { asyncHandler } from "./asyncHandler";

interface RouteSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

type Validated<S extends RouteSchemas> = {
  body: S["body"] extends ZodSchema ? ZInfer<S["body"]> : undefined;
  query: S["query"] extends ZodSchema ? ZInfer<S["query"]> : undefined;
  params: S["params"] extends ZodSchema ? ZInfer<S["params"]> : undefined;
};

export type ValidatedRequest<S extends RouteSchemas> = AuthRequest & {
  validated: Validated<S>;
};

type ValidatedHandler<S extends RouteSchemas> = (
  req: ValidatedRequest<S>,
  res: Response,
  next: NextFunction,
) => Promise<void> | void;

/**
 * Compose la validation Zod et un handler typé en une chaine de middlewares
 * Express. Le handler reçoit req.validated.{body,query,params} entièrement
 * typés depuis les schémas. Aucun cast nécessaire dans le handler.
 *
 * Exemple :
 *   router.get(
 *     "/",
 *     requireAuth, resolveTenant, requireOrg,
 *     ...typedRoute({ query: listEntitesQuery }, async (req, res) => {
 *       // req.validated.query est typé ListEntitesQuery automatiquement
 *       const result = await service.listEntites(req.orgId!, req.validated.query);
 *       res.json(result);
 *     }),
 *   );
 */
export function typedRoute<S extends RouteSchemas>(
  schemas: S,
  handler: ValidatedHandler<S>,
): RequestHandler[] {
  const validateMw: RequestHandler = (req, res, next) => {
    try {
      const v: Record<string, unknown> = {};
      if (schemas.params) {
        const parsed = schemas.params.parse(req.params);
        v.params = parsed;
        // req.params reste mutable en Express 5, on le synchronise pour
        // les middlewares en aval qui liraient encore req.params.X
        req.params = parsed as typeof req.params;
      }
      if (schemas.query) {
        // req.query est un getter immuable en Express 5 : seul
        // req.validated.query expose les defauts/coercions Zod
        v.query = schemas.query.parse(req.query);
      }
      if (schemas.body) {
        const parsed = schemas.body.parse(req.body);
        v.body = parsed;
        req.body = parsed;
      }
      (req as unknown as { validated: Record<string, unknown> }).validated = v;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues
          .map((e: ZodIssue) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        res.status(400).json({ error: message });
        return;
      }
      next(err);
    }
  };

  // Le handler typé étend AuthRequest, asyncHandler accepte ce type via la
  // covariance des paramètres : on passe la version élargie sans perte.
  const wrapped = asyncHandler(
    handler as (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>,
  );
  return [validateMw, wrapped];
}
