/**
 * Middleware Keycloak — Validation JWT via JWKS (cles publiques)
 * Remplace l'ancien auth.ts + jwt.ts custom
 *
 * Le token est verifie par la cle publique de Keycloak (asymetrique).
 * Pas besoin de secret partage — on telecharge les cles depuis le JWKS endpoint.
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { createLogger } from "../utils/logger";

const logger = createLogger("KeycloakAuth");

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || "https://auth.normx-ai.com";
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || "normx";
const JWKS_URI = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`;
const ISSUER = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`;

const client = jwksClient({
  jwksUri: JWKS_URI,
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
  rateLimit: true,
});

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRoles?: string[];
  orgId?: string;
  orgRole?: string;
  orgPermissions?: Record<string, boolean>;
  quotaIncremented?: boolean;
}

interface KeycloakPayload {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  email_verified?: boolean;
  realm_access?: { roles: string[] };
  resource_access?: Record<string, { roles: string[] }>;
  iat?: number;
  exp?: number;
}

function getSigningKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback): void {
  if (!header.kid) {
    callback(new Error("JWT header missing kid"));
    return;
  }
  client.getSigningKey(header.kid, (err, key) => {
    if (err) { callback(err); return; }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.split(" ")[1];
  }
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  return null;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    logger.warn(`[401] Token manquant — ${req.method} ${req.originalUrl}`);
    res.status(401).json({ error: "Token manquant" });
    return;
  }

  try {
    const payload = await new Promise<KeycloakPayload>((resolve, reject) => {
      jwt.verify(
        token,
        getSigningKey,
        {
          issuer: ISSUER,
          algorithms: ["RS256"],
        },
        (err, decoded) => {
          if (err) reject(err);
          else resolve(decoded as KeycloakPayload);
        }
      );
    });

    req.userId = payload.sub;
    req.userEmail = payload.email || payload.preferred_username || "";
    req.userName = payload.name || "";
    req.userRoles = payload.realm_access?.roles || [];

    // Verifier que l'user a le role "fiscaliste" ou "admin"
    if (!req.userRoles.includes("fiscaliste") && !req.userRoles.includes("admin")) {
      res.status(403).json({
        error: "Acces refuse — abonnement Tax requis",
        requiredRole: "fiscaliste",
      });
      return;
    }

    next();
  } catch (err) {
    logger.warn(
      `[401] Token Keycloak invalide — ${req.method} ${req.originalUrl} — ${err instanceof Error ? err.message : "unknown"}`
    );
    res.status(401).json({ error: "Token invalide ou expire" });
  }
}

/**
 * Middleware pour verifier qu'un utilisateur a un role specifique
 */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRoles || !roles.some(r => req.userRoles!.includes(r))) {
      res.status(403).json({ error: "Acces refuse — role insuffisant" });
      return;
    }
    next();
  };
}

/**
 * Middleware optionnel — extrait le user si un token est present, sinon continue
 */
export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) { next(); return; }

  try {
    const payload = await new Promise<KeycloakPayload>((resolve, reject) => {
      jwt.verify(token, getSigningKey, { issuer: ISSUER, algorithms: ["RS256"] }, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded as KeycloakPayload);
      });
    });
    req.userId = payload.sub;
    req.userEmail = payload.email || "";
    req.userName = payload.name || "";
    req.userRoles = payload.realm_access?.roles || [];
  } catch {
    // Token invalide — on continue sans auth
  }
  next();
}
