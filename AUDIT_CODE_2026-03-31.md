# Audit Complet CGI-242 - 31/03/2026

## Toutes les corrections appliquees

### Critiques
- SQL Injection `analytics.db.ts` : parametre `make_interval(days => $2)`
- CI heredoc whitespace + health check bloquant (exit 1)

### Securite
- Token SSE via `getToken()` (plus de localStorage direct ni de cle incorrecte)
- `server_tokens off`, Swagger restreint par IP, CSP restrictif, HSTS preload
- `escapeHtml()` dans les emails, `microphone=()`
- Conflit server_name resolu

### Performance
- HTTP/2, `proxy_read_timeout 120s` pour Claude AI
- Singleton Prisma + Qdrant (plus de doublons connexions)
- ThemeProvider `useMemo`, theme en `localStorage`
- Healthchecks Qdrant + Nginx (wget Alpine)
- `getStats()` : GROUP BY au lieu de charger tous les logs en memoire
- `getMemberStats()` : 2 requetes GROUP BY au lieu de 2*N COUNT individuels
- `checkCredits`/`checkAuditCredits` factorise en `deductCredits(cost)` (-100 lignes)
- `isFiscalQuery` inline (plus de doublon `isSimpleGreeting`)

### Bugs corriges
- `resolveTenant` ajoute (search-history 3 routes + user-stats)
- `req.orgId` au lieu de `(req as any).organizationId`
- `useActiveCode()` avant les early returns (Rules of Hooks)
- `user.role` au lieu de `user.globalRole`

### Types stricts (zero any)
- 39 composants : `colors: any` -> `ThemeColors`
- 48 catch blocks : annotations retirees
- 12 `as any` remplaces (TextStyle, Href, Ionicons.glyphMap, etc.)
- `Prisma.InvoiceWhereInput`, `RawArticle`, Window.turnstile type

### Dead code supprime (~2500 lignes, 13 fichiers)
- `auth.ts`, `mfa.routes.ts`, `mfa.service.ts`, `mfa.backup.service.ts`
- `tokenBlacklist.service.ts`, `csrf.middleware.ts`, `auth.ts` (middleware)
- `jwt.ts`, `otp.ts`, `auth.schema.ts`, `mfa.schema.ts`
- `auth.test.ts`, `mfa.test.ts`
- `authLimiter` retire, dead quota check supprime
- `deploy.sh` + 7 fichiers .md obsoletes

### Dependencies nettoyees
- `bcryptjs`, `otpauth`, `qrcode` retires des dependencies (plus utilises)
- `@types/bcryptjs`, `@types/jsonwebtoken`, `@types/qrcode` retires
- `@types/multer`, `@types/pg` deplaces vers devDependencies

## A corriger (restant)

### Hautes
| # | Fichier | Probleme |
|---|---------|----------|
| 3 | `mobile/lib/store/auth.ts:111` | Tokens en localStorage (architecture a revoir : memory-only + silent refresh Keycloak) |
| 24 | `mobile/lib/store/auth.ts` | `storeTokens`/`clearTokens` no-op sur mobile natif |

### Moyennes
| # | Fichier | Probleme |
|---|---------|----------|
| 19 | `mobile/` 4 stores | 4 abstractions de storage differentes a unifier |
| 20 | `mobile/` 3 fichiers | `getInitials()` duplique 3 fois |
| 35 | Divers | Imports inutilises (`fontWeights` dans simulateurs) |
| 37 | Divers | Strings hardcodees en francais (SessionExpiredModal, patente.tsx) |

## Points positifs

- Zero `any`, zero dead code auth/MFA
- Singleton Prisma + Qdrant, GROUP BY au lieu de N+1
- HTTP/2, HSTS preload, CSP restrictif, server_tokens off
- Proxy 120s pour IA, ThemeProvider optimise
- Healthchecks sur tous les services
- Swagger restreint, emails echappes
- Dependencies nettoyees (3 packages inutiles retires)
- CI health check bloquant
