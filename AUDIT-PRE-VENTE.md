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

### 1.2 Race condition sur la deduction de credits ✅ RESOLU (2026-04-14)

- Fichier : `server/src/middleware/subscription.middleware.ts`
- Commit : `cd6a37b`
- Deux problemes corriges :
  1. Les 2 UPDATE (`organization_members` + `subscriptions`) n'etaient pas dans une transaction → divergence possible des compteurs en cas de crash entre les ecritures
  2. Les credits etaient debites AVANT le travail → l'utilisateur payait meme si Claude echouait

- Solution implementee : pattern "check + confirm"
  - `reserveCreditsInternal` (middleware) : verifie la disponibilite via SELECT, AUCUNE ecriture DB. Attache `req.pendingCreditCost` et `req.pendingCreditPlan`
  - `confirmCreditUsage(req)` : helper exporte, execute les 2 UPDATE dans une transaction Prisma. Rollback automatique si une ecriture echoue
  - Routes adaptees :
    - `chat.ts` : confirm apres l'event `done` du stream (pas de debit si Claude plante)
    - `audit-facture.routes.ts` : confirm apres l'enregistrement en DB de l'audit reussi
  - Race condition rare (double reservation au dernier credit) detectee par le `WHERE creditsUsed + cost <= limit` atomique, loggee comme warning

- Resultat :
  - Atomicite garantie : plus de divergence entre `member.creditsUsed` et `subscription.creditsUsed`
  - Equite : aucun credit preleve si le travail echoue (Claude overloaded, timeout, erreur reseau)

### 1.3 Webhook Stripe inexistant (reporte — pas bloquant immediat)

- Aucune route `/webhook/stripe` detectee
- **Contexte metier** : NORMX AI SAS est en cours de creation. Pas encore de compte Stripe, pas encore de facturation clients. Le webhook n'est donc pas necessaire pour la mise en ligne beta actuelle.
- Ce point sera repris des que la societe sera enregistree et que le compte Stripe sera cree.
- Fix (pour plus tard) : implementer `/webhook/stripe` avec verification signature

**Reclasse en P2** (pas bloquant tant que l'app est en beta gratuite).

### 1.4 Dependances vulnerables CVE ✅ RESOLU (2026-04-14)

- Commit : `2b5a77d`
- `npm audit` reel au moment du fix :
  - **Server** : 1 moderate (nodemailer <=8.0.4, CRLF injection) → fixe
  - **Mobile** : 1 critical (axios <=1.14.0, SSRF + metadata exfil) + 1 moderate (follow-redirects, auth header leak) → fixes
- Resultat apres `npm audit fix` :
  - Server : 0 vulnerabilites
  - Mobile : 5 vulnerabilites low restantes (toutes transitives via `@tootallnate/once → http-proxy-agent → jsdom → jest-environment-jsdom → jest-expo`)
- Les 5 restantes sont acceptees : devDependencies (jamais shippees en production), non-exploitables par un attaquant externe. Le fix force downgraderait `jest-expo` de 48 a 47 (breaking change sur les tests).
- Note : l'audit initial mentionnait handlebars et express-rate-limit mais les vraies CVE identifiees au moment du fix etaient axios et nodemailer (les listes de CVE sont dynamiques).

### 1.5 Validation schema SQL trop permissive ✅ RESOLU (2026-04-14)

- Fichier : `server/src/db/pool.ts`
- Analyse approfondie : le code existant prefixait deja toujours avec `tenant_`, donc `pg_catalog`/`information_schema` ne pouvaient jamais etre renvoyes directement. Mais les helpers db (`chat.db.ts`, `analytics.db.ts`, `alertes.db.ts`, `audit.db.ts`) acceptaient `schema: string` et l'injectaient directement en raw SQL via template literals, sans re-validation. Un bug en amont aurait pu permettre une injection.

- Solution implementee :
  1. Nouveau pattern strict `TENANT_SCHEMA_REGEX = /^tenant_[a-z0-9_]{1,55}$/` — force le prefixe `tenant_` + char set limite
  2. `getValidatedSchemaName(slug)` : construit depuis un slug utilisateur, verifie le pattern strict
  3. Nouveau `assertSafeSchemaName(schema)` exporte : verification defensive en entree des helpers db. Leve une exception si pattern non-respecte (pas de sanitization silencieuse — on veut que le bug soit loud).
  4. Appel defensif de `assertSafeSchemaName` dans toutes les fonctions des db helpers (`chat.db`, `analytics.db`, `alertes.db`, `audit.db`) qui injectent le schema via template literal.

- Effet : toute injection SQL via schema est maintenant bloquee a deux niveaux (construction + utilisation), et tout bug futur sur ces helpers fail fast avec un 500 clair plutot que d'executer une requete malicieuse.

### 1.6 Pagination absente sur 2 endpoints analytics ✅ RESOLU (2026-04-14)

- Fichier : `server/src/routes/analytics.routes.ts` + service + schemas
- Probleme reel trouve :
  - `/popular-searches` acceptait `limit` de la query sans cap → un attaquant pouvait demander `?limit=999999999` → scan/groupBy massif Prisma → crash memoire
  - `/response-times` : periode hardcodee a 30 jours, aucun parametrage ni cap
- Solution implementee :
  1. Nouveau schema `popularSearchesQuery` : `limit` 1..100 (default 10) + `offset` >=0 (default 0)
  2. Nouveau schema `responseTimesQuery` : `days` 1..365 (default 30) — plafonne pour eviter un scan sur plusieurs annees
  3. `daysQuery` existant mis a jour avec `.max(365)`
  4. Routes validees par `validate({ query: ... })` qui rejette 400 si hors bornes
  5. Service `getPopularSearches` accepte maintenant `offset`
  6. Service `getResponseTimeStats` accepte maintenant `days` parametrable

---

## 2. A surveiller (urgent mais pas bloquant)

### 2.1 Catch silencieux dans chat.service.ts ✅ RESOLU (2026-04-14)

- Verification effectuee : plus aucun `.catch(() => {})` silencieux dans `server/src` (hors tests)
- Les 4 catches de `chat.service.ts` (2 dans sendMessage, 2 dans sendMessageStream pour les fire-and-forget sur createSearchHistory et trackUsage) loggent tous maintenant via `logger.warn` avec contexte. Deja corrige lors des fixes precedents sur le retry Anthropic.
- Bonus : le fallback `.catch(() => [{ count: BigInt(0) }])` de `analytics.service.ts:259` (requete raw document_audits) logge maintenant aussi un warning avant de renvoyer la valeur par defaut. Ca ne change pas le comportement fonctionnel mais donne de la visibilite en prod si la table n'existe pas ou si la requete echoue.

### 2.2 N+1 dans analytics.service.ts ✅ RESOLU (2026-04-14)

- `getPopularSearches` faisait 2 requetes Prisma en chaine (organizationMember puis groupBy searchHistory avec IN array). Suboptimal avec beaucoup de membres ou beaucoup de searches.
- Refactor en une seule requete `$queryRaw` avec sous-select :

  ```sql
  SELECT sh.query, COUNT(*)::bigint AS count
  FROM search_history sh
  WHERE sh."userId" IN (
    SELECT om."userId" FROM organization_members om WHERE om."organizationId" = $1
  )
    AND sh."createdAt" >= $2
  GROUP BY sh.query
  ORDER BY count DESC
  LIMIT $3 OFFSET $4
  ```

- Postgres optimise ca en semi-join (index sur `search_history.userId` + `organization_members.organizationId`), donc performance lineaire sur le nombre de searches, pas quadratique.
- Le TODO P2 dans le code est supprime.

### 2.3 Healthcheck Nginx insuffisant ✅ RESOLU (2026-04-14)

- Analyse reelle (le repo concerne est `normx-ai/infra`, pas `tax`) : le healthcheck pointait deja vers `/health` (l'audit etait imprecis en disant `/`), mais cet endpoint etait un `return 200 "ok"` statique dans `00-default.conf` qui ne testait que nginx lui-meme. Nginx pouvait etre "healthy" pendant que `tax-api` etait completement down.
- Solution implementee (2 fichiers dans infra repo) :
  1. `nginx/conf.d/00-default.conf` : nouveau `location = /healthz-deep` qui proxy vers `http://tax-api:3003/health`. L'API tax teste elle-meme Prisma + Qdrant et renvoie 200 ou 503.
  2. `docker-compose.yml` (service nginx) : `healthcheck.test` passe de `http://127.0.0.1/health` a `http://127.0.0.1/healthz-deep`. Timeout augmente a 10s pour laisser le temps au deep check de repondre.
- L'endpoint `/health` statique est conserve pour les monitorings externes rapides (ping shallow).
- Resultat : nginx est marque unhealthy si tax-api, Prisma ou Qdrant sont down. Docker redemarre alors le container nginx apres 3 tentatives infructueuses.

### 2.4 Logging __DEV__ en prod potentiel ✅ RESOLU (2026-04-14)

- Analyse : `mobile/lib/api/client.ts:43` utilisait `if (__DEV__) console.warn("[api] Erreur injection token:", err)`. En Expo, `__DEV__` est normalement remplace par `false` au build production via Metro (dead code elimination), donc inoffensif. Mais au cas ou une mauvaise config laisserait `__DEV__ = true` en prod, l'objet `err` complet (potentiellement avec stack trace) serait expose dans la console du navigateur.
- Solution implementee :
  1. Utilise le logger centralise `createLogger("api")` de `lib/utils/logger.ts` qui gere nativement le basculement dev → Sentry en prod (jamais de log navigateur en prod, meme si `__DEV__` venait a etre true).
  2. Passe uniquement le `err.message` au logger, jamais l'objet `err` complet. Meme en cas de leak, pas de stack trace exposee.
- Verification : aucun autre `__DEV__ + console` trouve dans `mobile/lib`, `mobile/components`, `mobile/app`.

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

| #  | Aspect              | Statut (maj 2026-04-14) | Notes                                                                                         |
| -- | ------------------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| 1  | Flux critiques user | ⚠ partiel              | Signup/login/chat/simulateurs OK. Stripe webhook reporte (societe en cours de creation)       |
| 2  | Gestion erreurs     | ⚠ partiel              | Backend OK + env.guard + catch retry Claude. Reste : error boundary React + catch front       |
| 3  | Dead code           | ✓ OK                   | 0 TODO critique, routes propres                                                               |
| 4  | Branding / UX       | ✓ OK                   | Logo consistant, favicon, francais correct                                                    |
| 5  | Responsive mobile   | ✓ OK                   | Hook actif, modals mobile-friendly                                                            |
| 6  | Pages legales       | ✓ OK                   | Mentions, CGU, confidentialite conformes                                                      |
| 7  | Securite            | ✓ OK                   | npm audit fix (1.4), whitelist SQL + assertSafeSchemaName (1.5), credits atomiques (1.2)      |
| 8  | Performance         | ✓ OK                   | Indexes OK, pagination analytics ajoutee (1.6, cap 100/365). Reste N+1 documente en P2        |
| 9  | Monitoring          | ✓ OK                   | Logger structure, health check, no secret logged, env.guard fail-fast au boot                 |
| 10 | Deploiement         | ✓ OK                   | CI OK, secrets injectes proprement via GitHub Actions au deploy                               |

---

## 5. Plan d'action recommande (ordre de priorite)

| Priorite | Tache                                                    | Duree estimee | Statut      |
| -------- | -------------------------------------------------------- | ------------- | ----------- |
| P0       | `npm audit fix`                                          | 15 min        | ✅ fait (2b5a77d) |
| P0       | Whitelist schemas SQL dans `db/pool.ts`                  | 15 min        | ✅ fait        |
| P0       | Transaction atomique credits (middleware subscription)   | 1 h           | ✅ fait (cd6a37b) |
| P0       | Fix healthcheck Nginx sur `/healthz-deep` (deep check)   | 15 min        | ✅ fait (infra) |
| P1       | Validation des env vars critiques au boot (fail-fast)    | 30 min        | ✅ fait (03f47d5) |
| P1       | Error boundary React + catch visible front               | 2 h           | ⏳ pending   |
| P1       | Optional chaining response.content Claude                | 15 min        | ⏳ pending   |
| P0       | Pagination analytics routes (1.6)                        | 1 h           | ✅ fait      |
| P2       | N+1 analytics en sub-requete                             | 30 min        | ⏳ pending   |
| P2       | Logs sur catch silencieux chat.service                   | 15 min        | ⏳ pending   |
| P2       | Webhook Stripe (reporte : societe en cours de creation)  | 1 jour        | ⏸ reporte   |

**Notes de reclassification** :

- Point 1.1 de l'audit (`.env.production` vide) reclasse en P1 apres verification : les secrets sont correctement injectes au deploy via GitHub Actions secrets. Le fichier vide dans le repo est la bonne pratique.
- Point 1.3 (webhook Stripe) reclasse en P2 reporte : NORMX AI SAS est en cours de creation, pas encore de compte Stripe ni de facturation clients. Le webhook sera implemente quand la societe sera enregistree et que le compte Stripe sera cree.

**Progres** :

- P0 termines : 5/5 ✅ (credits check+confirm, npm audit fix, whitelist SQL, pagination analytics, healthcheck nginx)
- P1 termines : 4/5 (env.guard, catch silencieux, N+1 analytics, __DEV__ logging)
- Reste P1 : optional chaining Claude, error boundary React
- Reste P2 : webhook Stripe (reporte — societe en creation)

**🎉 TOUS LES P0 SONT TERMINES.** Le produit est techniquement pret pour une beta gratuite. Il reste uniquement des ameliorations P1/P2.

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
