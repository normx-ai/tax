# Audit pre-vente NORMX Tax (cgi-242)

Date : 2026-04-13
Scope : verification de la maturite du produit avant mise en vente a des clients reels.

## Verdict global : NOT READY

Le produit presente des **failles critiques de securite** et une **infrastructure de paiement incomplete** qui interdisent la vente a des clients reels sans corrections prioritaires. **Delai estime : 2-3 jours de travail.**

---

## 1. Bloquants (a corriger avant vente)

### 1.1 Validation des secrets au boot (faux positif sur `.env.production`)

**Note importante** : le fichier `server/.env.production` est intentionnellement vide dans le repo — c'est une bonne pratique de securite (on ne commit jamais de secrets). En production, les secrets sont injectes au moment du deploy par GitHub Actions.

Flux reel en production :

1. Les secrets sont stockes dans GitHub Actions : `Settings → Secrets and variables → Actions` du repo `normx-ai/tax`
2. Cles critiques actuellement gerees par ce canal :
   - `JWT_SECRET`, `JWT_REFRESH_SECRET`, `MFA_ENCRYPTION_KEY`
   - `ANTHROPIC_API_KEY`
   - `DATABASE_URL` / `POSTGRES_PASSWORD`
   - `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`
   - `VPS_SSH_KEY` (pour le deploy lui-meme)
3. Le workflow `.github/workflows/deploy.yml` recupere ces secrets a chaque push sur main
4. Au deploiement, il genere `server/.env.production` sur le VPS via un HEREDOC avec `${{ secrets.XXX }}`
5. Le conteneur Docker monte ce fichier et le backend le charge via dotenv

**Conclusion** : aucune donnee sensible n'est en clair dans le repo. Le produit fonctionne bien en production puisque GitHub injecte correctement les secrets.

**Hardening recommande (pas bloquant)** : ajouter une validation au demarrage du serveur pour fail-fast si une variable critique est absente, en cas d'erreur humaine lors d'une rotation de secret ou d'un deploy sur un nouvel environnement.

```ts
const REQUIRED = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'ANTHROPIC_API_KEY', 'DATABASE_URL'];
const missing = REQUIRED.filter((k) => !process.env[k]);
if (process.env.NODE_ENV === 'production' && missing.length > 0) {
  logger.error('Missing required env vars at boot:', missing);
  process.exit(1);
}
```

Ce point passe de **P0 bloquant** a **P1 hardening**.

### 1.2 Race condition sur la deduction de credits

- Fichier : `server/src/middleware/subscription.middleware.ts`
- Probleme : debit non-atomique avec increment subscription (fire-and-forget sans await)
- Risque : credits perdus si crash du process entre les deux operations
- Fix : wrapper les deux operations dans une transaction Prisma

### 1.3 Webhook Stripe inexistant

- Aucune route `/webhook/stripe` detectee
- Consequence : le passage free trial -> Pro est techniquement impossible
- Impact commercial : impossible d'encaisser des abonnements
- Fix : implementer `/webhook/stripe` avec verification signature

### 1.4 Dependances vulnerables CVE

- `handlebars 4.0.0-4.7.8` : 8 CVE XSS/RCE
- `express-rate-limit 8.2.0` : bypass IPv6 du rate limiting
- Fix : `npm audit fix` puis retests

### 1.5 Validation schema SQL trop permissive

- Fichier : `server/src/db/pool.ts`
- Probleme : regex accepte `pg_catalog`, `information_schema`
- Risque : pollution cross-tenant / fuite de donnees
- Fix : whitelist stricte de noms de schemas valides

### 1.6 Pagination absente sur 2 endpoints analytics

- Fichier : `server/src/routes/analytics.routes.ts`
- Methodes : `getPopularSearches()`, `getResponseTimeStats()`
- Risque : DoS potentiel avec des milliers d'organisations
- Fix : validation Zod avec `limit.max(100)` et offset

---

## 2. A surveiller (urgent mais pas bloquant)

### 2.1 Catch silencieux dans chat.service.ts

- `chat.service.ts:125-126` : `.catch(() => {})` sans log
- Impact : audit trail perdu, debug en prod difficile
- Fix : `.catch(err => logger.warn('...', err))`

### 2.2 N+1 dans analytics.service.ts

- Lignes 170-194 : 2 requetes separees au lieu d'un JOIN
- Impact : perf degradee avec 1000+ orgs
- Fix : sub-requete Prisma unique

### 2.3 Healthcheck Nginx insuffisant

- `docker-compose.yml` : test sur `/` au lieu de `/api/health`
- Risque : Nginx peut etre healthy pendant que l'API backend est down
- Fix : changer en `wget -qO- http://localhost/api/health`

### 2.4 Logging __DEV__ en prod potentiel

- `mobile/lib/api/client.ts:43` : log tokens si `__DEV__`
- Risque : tokens exposes si `__DEV__` reste true en build prod
- Fix : verifier la config Expo de build production

### 2.5 Optional chaining manquant sur reponse Claude

- `chat.service.ts:112` : `response.content[0].type`
- Risque : IndexError si reponse vide ou type `tool_use`
- Fix : `response.content?.[0]?.type === "text"`

### 2.6 TODO P2 documente dans analytics

- `analytics.service.ts:174` : "TODO P2: combiner en une seule requete SQL"
- Dette technique connue mais non resolue

---

## 3. Points forts (deja bons)

| Aspect        | Detail                                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| Auth          | Keycloak SSO + JWKS + cookies httpOnly + CSRF                                                                   |
| Pages legales | `/legal/mentions`, `/legal/cgu`, `/legal/confidentialite` 100% conformes (RCS, OVH hebergeur, RGPD, CNIL) |
| Branding      | NORMX consistant, favicon, document.title corrects, pas de Lorem ipsum                                          |
| Mobile        | `useResponsive` actif, modals ferment bien, chat KeyboardAvoidingView                                         |
| Logger        | Winston structure JSON en prod, pas de secret logge                                                             |
| Rate limiting | Global 300 req/15min, auth 10/h, chat 30/h                                                                      |
| Indexes DB    | Prisma indexes sur les colonnes searchables                                                                     |
| CI/CD         | GitHub Actions fonctionnel, secrets injectes au deploy                                                          |
| Dead code     | 0 TODO/FIXME dans `mobile/app`, aucune route backend orpheline                                                |
| Francais      | Textes corrects, pas d'anglicismes                                                                              |

---

## 4. Checklist des 10 aspects

| #  | Aspect              | Statut        | Notes                                                                 |
| -- | ------------------- | ------------- | --------------------------------------------------------------------- |
| 1  | Flux critiques user | ⚠ partiel    | Signup/login/chat/simulateurs OK. Passage Pro bloque (webhook absent) |
| 2  | Gestion erreurs     | ⚠ partiel    | Backend OK. Front : peu de catch, pas d'error boundary global         |
| 3  | Dead code           | ✓ OK         | 0 TODO critique, routes propres                                       |
| 4  | Branding / UX       | ✓ OK         | Logo consistant, favicon, francais correct                            |
| 5  | Responsive mobile   | ✓ OK         | Hook actif, modals mobile-friendly                                    |
| 6  | Pages legales       | ✓ OK         | Mentions, CGU, confidentialite conformes                              |
| 7  | Securite            | ✗ critique   | CVE handlebars + validation SQL + race condition credits              |
| 8  | Performance         | ⚠ bon        | Indexes OK, N+1 analytics, pagination manquante                       |
| 9  | Monitoring          | ✓ OK         | Logger structure, health check, no secret logged                      |
| 10 | Deploiement         | ✓ OK          | CI OK, secrets injectes proprement via GitHub Actions au deploy       |

---

## 5. Plan d'action recommande (ordre de priorite)

| Priorite | Tache                                                    | Duree estimee |
| -------- | -------------------------------------------------------- | ------------- |
| P0       | Implementer webhook Stripe (passage Pro)                 | 1 jour        |
| P0       | `npm audit fix` + fix validation SQL                     | 30 min        |
| P0       | Transaction atomique credits (middleware subscription)   | 1 h           |
| P0       | Fix healthcheck Nginx sur `/api/health`                  | 15 min        |
| P1       | Validation des env vars critiques au boot (fail-fast)    | 30 min        |
| P1       | Error boundary React + catch visible front               | 2 h           |
| P1       | Optional chaining response.content Claude                | 15 min        |
| P1       | Pagination analytics routes                              | 1 h           |
| P2       | N+1 analytics en sub-requete                             | 30 min        |
| P2       | Logs sur catch silencieux chat.service                   | 15 min        |

**Note** : le point 1.1 de l'audit (`.env.production` vide) est reclasse en P1 apres verification : les secrets sont correctement injectes au deploy via GitHub Actions secrets. Le fichier vide dans le repo est la bonne pratique.

**Total P0 (bloquants avant vente) : ~1.5 jours de travail.**
**Total P0 + P1 (vente + stabilisation) : ~2.5 jours de travail.**

---

## 6. Non-verifie (a faire manuellement)

Ces points demandent un test runtime et ne peuvent pas etre audites par analyse statique :

- Test end-to-end complet du parcours signup -> paiement -> usage
- Charge test : 100 utilisateurs concurrents sur le chat
- Cross-browser : Chrome, Firefox, Safari, Edge
- Mobile device tests : iOS Safari, Android Chrome
- Test du pipeline de deploy complet (rollback inclus)
- Verification des emails transactionnels (bienvenue, reset password, verification code)
- Audit des performances Lighthouse
