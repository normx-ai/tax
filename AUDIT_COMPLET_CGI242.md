# AUDIT COMPLET - CGI-242 (TAX)
**Date :** 5 avril 2026
**Projet :** cgi-242 (Expo React Native + Express + Prisma + PostgreSQL + Qdrant)
**Scope :** Securite, Performance, Bugs, Duplication, Infrastructure
**Statut :** A CORRIGER

---

## TABLE DES MATIERES

1. [Resume executif](#1-resume-executif)
2. [Critiques (P0)](#2-critiques-p0)
3. [Hautes (P1)](#3-hautes-p1)
4. [Moyennes (P2)](#4-moyennes-p2)
5. [Basses (P3)](#5-basses-p3)
6. [Plan d'action](#6-plan-daction)

---

## 1. RESUME EXECUTIF

| Severite | Nombre | Domaines |
|----------|--------|----------|
| CRITIQUE (P0) | 3 | Dependances, secrets, race condition |
| HAUTE (P1) | 7 | N+1, catch vides, healthcheck, validation |
| MOYENNE (P2) | 8 | Logging, storage, tests, index Prisma |
| BASSE (P3) | 5 | Duplication, env, cache |
| **Total** | **23** | |

**Score global estime : 83/100** (bon, mais des failles critiques a corriger)

---

## 2. CRITIQUES (P0)

### 2.1 Dependances vulnerables
**Severite :** CRITIQUE
**Impact :** RCE, injection, DoS

Backend (`server/`) :
| Package | Vulnerabilite | Severite |
|---------|--------------|----------|
| handlebars 4.0.0-4.7.8 | 8 vulnerabilites XSS/RCE | CRITIQUE |
| nodemailer <8.0.4 | SMTP command injection | HAUTE |
| undici <=6.23.0 | WebSocket crash, HTTP smuggling | HAUTE |
| express-rate-limit 8.2.0-8.2.1 | IPv4-mapped IPv6 bypass | HAUTE |
| defu <=6.1.4 | Prototype pollution | HAUTE |
| path-to-regexp 8.0.0-8.3.0 | ReDoS | HAUTE |

Frontend (`mobile/`) :
| Package | Vulnerabilite | Severite |
|---------|--------------|----------|
| handlebars | XSS/RCE | CRITIQUE |
| flatted <=3.4.1 | DoS via recursive parse() | HAUTE |
| lodash <=4.17.23 | Template injection | HAUTE |
| node-forge <=1.3.3 | Signature forgery | HAUTE |

**Correction :**
```bash
cd server && npm audit fix
cd mobile && npm audit fix
```

---

### 2.2 Secrets manquants en production
**Severite :** CRITIQUE
**Fichier :** `server/.env.production`

Les variables suivantes sont vides ou absentes :
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `MFA_ENCRYPTION_KEY`
- `TURNSTILE_SECRET_KEY`
- `MOBILE_API_SECRET`
- `VOYAGE_API_KEY`
- `ANTHROPIC_API_KEY`
- `SMTP_*`

**Correction :** Ajouter validation au demarrage dans `server/src/server.ts` :
```typescript
const requiredSecrets = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'ANTHROPIC_API_KEY'];
const missing = requiredSecrets.filter(k => !process.env[k]);
if (missing.length > 0 && process.env.NODE_ENV === 'production') {
  logger.error('Missing required secrets: ' + missing.join(', '));
  process.exit(1);
}
```

---

### 2.3 Race condition deduction de credits
**Severite :** CRITIQUE
**Fichier :** `server/src/middleware/subscription.middleware.ts:182-192`

```typescript
// Step 1 : debit member (atomique)
const affected = await prisma.$executeRaw`...`;

// Step 2 : increment subscription (fire-and-forget, PAS await!)
prisma.subscription.update({
  where: { organizationId: req.orgId },
  data: { creditsUsed: { increment: cost } },
}).catch((err) => { logger.error('...', err); });
```

Si crash entre step 1 et step 2 : member debite mais compteur org non mis a jour.

**Correction :** Wrapper dans une transaction Prisma :
```typescript
await prisma.$transaction(async (tx) => {
  // Step 1 + Step 2 dans la meme transaction
});
```

---

## 3. HAUTES (P1)

### 3.1 Requetes N+1 dans analytics
**Fichier :** `server/src/services/analytics.service.ts:170-194`

`getPopularSearches()` fait 2 requetes separees (members puis search history) au lieu d'un JOIN.

**Correction :** Utiliser une sous-requete Prisma avec relation `user.memberships`.

---

### 3.2 Catch vides silencieux
**Fichier :** `server/src/services/chat.service.ts:125-126, 195-196`

```typescript
chatDb.createSearchHistory(...).catch(() => {});
analyticsDb.trackUsage(...).catch(() => {});
```

Erreurs avalees silencieusement. Audit trail incomplet.

**Correction :** Remplacer par `.catch((err) => { logger.warn('...', err); });`

---

### 3.3 Null/undefined non gere sur reponse Claude
**Fichier :** `server/src/services/chat.service.ts:112`

```typescript
const assistantContent = response.content[0].type === "text"
  ? response.content[0].text : "";
```

`response.content` peut etre vide (IndexError) ou de type `tool_use`.

**Correction :** Ajouter optional chaining : `response.content?.[0]?.type === "text"`

---

### 3.4 Healthcheck Nginx insuffisant
**Fichier :** `docker-compose.yml:120-124`

```yaml
healthcheck:
  test: ["CMD-SHELL", "wget -qO- http://localhost:80/ || exit 1"]
```

Nginx peut repondre 200 meme si le backend API est down.

**Correction :** Verifier `/api/health` au lieu de `/`.

---

### 3.5 Validation schema SQL trop permissive
**Fichier :** `server/src/db/pool.ts:13-19`

La regex accepte trop de patterns. Ajouter une whitelist de schemas reserves a rejeter (`public`, `pg_catalog`, `information_schema`).

---

### 3.6 Pagination manquante sur analytics
**Fichier :** `server/src/routes/analytics.routes.ts`

`getPopularSearches` et `getResponseTimeStats` n'ont pas de pagination.

**Correction :** Ajouter `limit` et `offset` valides par Zod.

---

### 3.7 express-rate-limit vulnerable
**Version :** 8.2.0-8.2.1

IPv4-mapped IPv6 addresses peuvent bypasser le rate limiting.

**Correction :** `npm update express-rate-limit`

---

## 4. MOYENNES (P2)

### 4.1 Logging info sensible mobile
**Fichier :** `mobile/lib/api/client.ts:43`

```typescript
if (__DEV__) console.warn("[api] Erreur injection token:", err);
```

Si `__DEV__` reste true en prod build, le token error est logge.

---

### 4.2 failedQueue sans limite
**Fichier :** `mobile/lib/api/client.ts:49-77`

La queue de retry des requetes 401 peut grandir indefiniment.

**Correction :** Ajouter `MAX_QUEUE_SIZE = 100`.

---

### 4.3 Race condition sync/async storage Zustand
**Fichier :** `mobile/lib/store/auth.ts:77-109`

`localStorage.getItem` (sync) vs `expo-secure-store.getItemAsync` (async) peut causer des races.

**Correction :** Toujours retourner une Promise.

---

### 4.4 Read-only filesystem bypass Docker
**Fichier :** `docker-compose.yml:27-30`

`/app/storage/` (invoices PDF) n'est pas en tmpfs.

**Correction :** Ajouter un volume nomme pour `/app/storage`.

---

### 4.5 Input validation manquante
**Fichier :** `server/src/routes/search-history.routes.ts:20-30`

`limit` et `offset` parses sans validation (NaN, negatif possible).

**Correction :** Utiliser Zod schema avec `z.coerce.number().int().positive().max(100)`.

---

### 4.6 Couverture tests 0.05%
6 tests pour 13K lignes de code.

Manquent : subscription middleware, tenant isolation, chat RAG, integration tests.

---

### 4.7 Index Prisma manquants
**Fichier :** `server/prisma/schema.prisma`

| Table | Index manquant | Justification |
|-------|---------------|---------------|
| Message | `@@index([conversationId, createdAt])` | Tri par date dans une conversation |
| Subscription | `@@index([status])` | Filtrage par statut actif |
| Subscription | `@@index([plan])` | Filtrage par plan |

---

### 4.8 Unique constraints manquants
**Fichier :** `server/prisma/schema.prisma`

`stripeCustomerId` et `stripeSubscriptionId` ne sont pas `@unique`. Possible duplication si Stripe retry.

---

## 5. BASSES (P3)

### 5.1 Duplication validation schema name
`getValidatedSchemaName()` dans `db/pool.ts` pourrait etre reutilise dans `tenant.service.ts` au lieu de re-valider.

### 5.2 Logger factory non singleton
Chaque fichier cree son propre logger avec `createLogger("context")`. Pas de singleton/factory centralise.

### 5.3 .env.example frontend avec vraies cles
`mobile/.env.example` contient des cles publiques reelles (SENTRY_DSN, TURNSTILE_SITE_KEY).

### 5.4 Cache TTL subscription trop court
Le cache subscription est requete a chaque middleware call. Augmenter le TTL et invalider par event.

### 5.5 .env expose via Docker COPY
Le Dockerfile copie `.env.production` dans l'image. Preferer `docker secrets` ou `--build-arg`.

---

## 6. PLAN D'ACTION

### Phase 1 : URGENT (P0) - 2h
| # | Action | Fichier | Effort |
|---|--------|---------|--------|
| 1 | npm audit fix (backend + frontend) | package.json | 30min |
| 2 | Validation secrets au demarrage | server/src/server.ts | 15min |
| 3 | Transaction atomique deduction credits | subscription.middleware.ts | 1h |

### Phase 2 : IMPORTANT (P1) - 4h
| # | Action | Fichier | Effort |
|---|--------|---------|--------|
| 4 | Corriger catch vides (logger.warn) | chat.service.ts | 15min |
| 5 | Null check reponse Claude | chat.service.ts | 15min |
| 6 | Corriger N+1 analytics | analytics.service.ts | 1h |
| 7 | Healthcheck Nginx → /api/health | docker-compose.yml | 15min |
| 8 | Validation schema SQL stricte | db/pool.ts | 30min |
| 9 | Pagination analytics | analytics.routes.ts | 30min |
| 10 | Update express-rate-limit | package.json | 15min |

### Phase 3 : MOYEN (P2) - 4h
| # | Action | Fichier | Effort |
|---|--------|---------|--------|
| 11 | Limit failedQueue mobile | mobile/lib/api/client.ts | 30min |
| 12 | Fix async storage Zustand | mobile/lib/store/auth.ts | 30min |
| 13 | Input validation search-history | search-history.routes.ts | 15min |
| 14 | Index Prisma + unique constraints | schema.prisma | 30min |
| 15 | Volume Docker pour storage | docker-compose.yml | 15min |

### Phase 4 : BASSES (P3) - 2h
| # | Action | Fichier | Effort |
|---|--------|---------|--------|
| 16 | Logger factory singleton | utils/logger.ts | 30min |
| 17 | Nettoyer .env.example | mobile/.env.example | 15min |
| 18 | Cache TTL event-based | subscription.middleware.ts | 30min |

---

**Effort total estime : ~12h**
**Priorite absolue : P0 (dependances + secrets + race condition)**
