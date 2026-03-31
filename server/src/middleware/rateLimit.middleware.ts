import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Global : 100 requêtes par 15 minutes par IP
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessayez dans quelques minutes' },
});

/**
 * Sensitive : 10 requêtes par heure par IP
 * Pour changement de mot de passe, MFA enable/disable, envoi OTP
 */
export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives sur cette action sensible, réessayez dans 1 heure' },
});

/**
 * Chat : 30 requêtes par heure par IP
 * Les appels LLM sont coûteux — limiter l'abus
 */
export const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 200 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de messages envoyés, réessayez dans quelques minutes' },
});
