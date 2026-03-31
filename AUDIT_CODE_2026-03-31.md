# Audit Complet CGI-242 - 31/03/2026

## Corrections appliquees

### Critiques
| # | Correction |
|---|------------|
| 1 | SQL Injection `analytics.db.ts:35` : `INTERVAL '${days}'` remplace par `make_interval(days => $2)` parametre |
| 2 | CI heredoc `deploy.yml:64-86` : suppression des espaces en debut de ligne + health check bloquant (exit 1) |

### Securite
| # | Correction |
|---|------------|
| 4-5 | Token SSE `chat.ts` : utilise `useAuthStore.getState().getToken()` au lieu de localStorage direct et cle incorrecte |
| 6 | Swagger `/docs` restreint par IP (allow/deny) |
| 7 | `server_tokens off` ajoute dans nginx.conf |
| 15 | `audit-facture.routes.ts:53` : `(req as any).organizationId` remplace par `req.orgId` |
| 22 | Emails : `escapeHtml()` ajoute pour inviterName et organizationName |
| 23 | CSP restreint : connect-src limite a tax/auth/sentry, HSTS preload, microphone=() |
| 31 | `tax.normx-ai.com` retire du server_name de normx-ai.conf (conflit) |

### Performance
| # | Correction |
|---|------------|
| 8 | Double PrismaClient `ingestion.service.ts` remplace par import singleton |
| 10 | HTTP/2 active, proxy_read_timeout passe a 120s |
| 27 | ThemeProvider value memoize avec useMemo |
| 28 | Double client Qdrant remplace par singleton `getQdrantClient()` |
| 29 | Healthcheck Qdrant ajoute (wget healthz), depend service_healthy |
| 30 | Healthcheck Nginx : curl remplace par wget (Alpine) |

### Bugs
| # | Correction |
|---|------------|
| 11 | `useActiveCode()` deplace avant les early returns (Rules of Hooks) |
| 13-14 | `resolveTenant` ajoute sur search-history (3 routes) et user-stats |
| 16 | `user?.globalRole` remplace par `user?.role` |

### Types stricts (zero any)
| # | Correction |
|---|------------|
| -- | 39 composants mobile : `colors: any` -> `ThemeColors` avec import type |
| -- | 48 catch blocks : `err: any` / `err: unknown` -> `err` sans annotation |
| -- | 12 casts mobile : `as any` remplaces par types stricts (TextStyle, Href, Ionicons.glyphMap, etc.) |
| -- | `where: any` -> `Prisma.InvoiceWhereInput` dans invoice.service.ts |
| -- | `(a: any)` -> `RawArticle & { numero?: string }` dans social.ts |
| -- | Window.turnstile type avec declaration globale |
| -- | Props `colors?: unknown` inutilisees supprimees (NumberField, SimulateurSection) |

### Dead code supprime (13 fichiers, ~2500 lignes)
| Fichier supprime | Raison |
|---|---|
| `server/src/routes/auth.ts` | Ancien auth remplace par Keycloak |
| `server/src/routes/mfa.routes.ts` | Ancien MFA remplace par Keycloak |
| `server/src/services/mfa.service.ts` | Ancien MFA |
| `server/src/services/mfa.backup.service.ts` | Ancien MFA backup codes |
| `server/src/services/tokenBlacklist.service.ts` | Ancien token blacklist |
| `server/src/middleware/auth.ts` | Ancien middleware auth cookie |
| `server/src/middleware/csrf.middleware.ts` | Ancien CSRF (Keycloak gere) |
| `server/src/utils/jwt.ts` | Ancien JWT (bloquait le demarrage) |
| `server/src/utils/otp.ts` | Ancien OTP |
| `server/src/schemas/auth.schema.ts` | Ancien schemas validation auth |
| `server/src/schemas/mfa.schema.ts` | Ancien schemas validation MFA |
| `server/src/__tests__/auth.test.ts` | Tests de l'ancien auth |
| `server/src/__tests__/mfa.test.ts` | Tests de l'ancien MFA |

### Autres nettoyages
| Correction |
|------------|
| `authLimiter` retire du rate limiter et des imports app.ts |
| Dead code `inviteMember` quota check supprime dans organization.service.ts |
| `console.log` remplace par logger structure dans tenant.service.ts |
| sessionStorage remplace par localStorage pour le theme |
| deploy.sh obsolete supprime |
| 7 fichiers .md obsoletes supprimes |

## A corriger (restant)

### Hautes
| # | Fichier | Probleme |
|---|---------|----------|
| 3 | `mobile/lib/store/auth.ts:111` | Tokens en localStorage (passer a memory-only + silent refresh Keycloak) |
| 9 | `server/src/services/audit.service.ts:120` | `getStats()` charge tous les logs en memoire (utiliser GROUP BY) |
| 24 | `mobile/lib/store/auth.ts` | `storeTokens`/`clearTokens` ne font rien sur mobile natif |

### Moyennes - Duplication
| # | Fichier | Probleme |
|---|---------|----------|
| 17 | `subscription.middleware.ts` + `subscription.service.ts` | Reset mensuel credits duplique |
| 18 | `subscription.middleware.ts` | `checkCredits`/`checkAuditCredits` quasi-identiques |
| 19 | `mobile/` 4 stores | 4 abstractions de storage differentes |
| 20 | `mobile/` 3 fichiers | `getInitials()` duplique 3 fois |
| 21 | `chat.service.ts` + `chat.utils.ts` | `isSimpleGreeting()` duplique |

### Moyennes - Performance
| # | Fichier | Probleme |
|---|---------|----------|
| 25 | `server/src/services/analytics.service.ts:125` | N+1 queries dans `getMemberStats` |

### Basses
| # | Probleme |
|---|----------|
| 35 | Imports inutilises (`fontWeights` dans simulateurs) |
| 37 | Strings hardcodees en francais (SessionExpiredModal, patente.tsx) |
| 38 | `@types/multer` et `@types/pg` dans dependencies au lieu de devDependencies |

## Points positifs

- Containers non-root, multi-stage Docker build, filesystem read-only
- Resource limits et healthchecks sur tous les services (Postgres, Qdrant, Nginx)
- Rate limiting, HTTP/2, HSTS preload
- SSL corrects, server_tokens off, Swagger restreint par IP
- CSP restrictif (domaines specifiques), emails echappes contre XSS
- PostgreSQL non expose, secrets via GitHub Secrets
- CI health check bloquant le deploy en cas d'echec
- Zero `any` dans le code source (hors tests)
- Types stricts partout (ThemeColors, TextStyle, Href, Prisma.WhereInput)
- Singleton Prisma et Qdrant (plus de doublons connexions)
- Proxy timeout 120s adapte aux appels Claude AI
- ThemeProvider optimise avec useMemo, theme persiste en localStorage
- Zero dead code auth/MFA (13 fichiers, ~2500 lignes supprimees)
