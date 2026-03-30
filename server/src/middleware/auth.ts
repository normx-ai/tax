import { Request, Response } from "express";
import { generateCsrfToken, setCsrfCookie, clearCsrfCookie } from "./csrf.middleware";
import { createLogger } from "../utils/logger";

const logger = createLogger("Auth");

// Note: AuthRequest et requireAuth sont dans keycloak-auth.ts (source unique)
// Ce fichier ne contient que les utilitaires cookies pour le legacy flow

/**
 * Détecte si le client est web (cookie) ou mobile (Bearer)
 * Le client mobile envoie X-Platform: mobile
 */
export function isWebClient(req: Request): boolean {
  return req.headers["x-platform"] !== "mobile";
}

/**
 * Set les cookies httpOnly pour le client web
 */
export function setAuthCookies(res: Response, token: string, refreshToken: string, rememberMe?: boolean): void {
  const req = (res as Response & { req?: Request }).req;
  const isSecure = req?.headers["x-forwarded-proto"] === "https" || req?.secure || process.env.NODE_ENV === "production";

  const cookieOpts = {
    httpOnly: true,
    secure: isSecure,
    sameSite: "strict" as const,
    path: "/",
  };

  const accessMaxAge = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 15 * 60 * 1000;
  const refreshMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

  res.cookie("accessToken", token, { ...cookieOpts, maxAge: accessMaxAge });
  res.cookie("refreshToken", refreshToken, { ...cookieOpts, maxAge: refreshMaxAge });

  setCsrfCookie(res, generateCsrfToken());

  logger.info(`Cookies set — secure: ${isSecure}, sameSite: strict, rememberMe: ${!!rememberMe}`);
}

/**
 * Supprime les cookies d'auth (logout web)
 */
export function clearAuthCookies(res: Response): void {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });
  clearCsrfCookie(res);
}
