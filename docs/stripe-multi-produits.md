# Stripe pour tous les produits NORMX — plan

Document de décision. Capture l'état actuel et les choix d'architecture
à trancher avant d'étendre Stripe à l'ensemble de la suite NORMX (Tax,
Compta, Paie, États, Legal).

Date : 2026-04-26
Statut : à décider

---

## 1. Ce qui existe déjà (intégration Stripe en cours dans cgi-242)

Mise en place réalisée le 26/04/2026 sur le périmètre Tax uniquement.

### Backend cgi-242
- `server/.env` (gitignored) : clés `pk_test_*` / `sk_test_*` configurées,
  placeholders `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PRO_MONTHLY`,
  `STRIPE_PRICE_ID_PRO_YEARLY`, `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`.
- `server/.env.example` : variables documentées.
- `server/src/config/stripe.ts` : client Stripe nullable + helper
  `getStripePriceId(plan, period)` (mapping plan → priceId, limité
  à PRO pour l'instant).
- `server/src/services/stripe.service.ts` :
  - `createCheckoutSession({orgId, plan, period, customerEmail, customerName})`
  - `verifyWebhookSignature` (HMAC sur body brut)
  - `handleWebhookEvent` (checkout.session.completed,
    customer.subscription.updated/deleted, invoice.payment_failed)
- `server/src/routes/stripe.routes.ts` :
  - `POST /api/stripe/checkout` (auth + Owner) → renvoie URL Checkout.
  - `POST /api/stripe/webhook` (public, signature vérifiée).
- `server/src/app.ts` :
  - `express.raw` monté avant `express.json` pour `/api/stripe/webhook`.
  - `/api/stripe/webhook` exclu du middleware d'auth global.

### Frontend cgi-242
- `mobile/lib/api/stripe.ts` : `stripeApi.createCheckoutSession(plan, period)`.
- `mobile/app/(app)/abonnement/index.tsx` : bloc « Paiement par carte
  bancaire » visible aux Owners en plan FREE, deux boutons mensuel/annuel
  qui redirigent vers Stripe Checkout.

### Documents légaux
- `mobile/app/legal/cgu.tsx` : Stripe ajouté à l'article 13
  (sous-traitants) et à l'article 4.3 (moyens de paiement).
- `mobile/app/legal/confidentialite.tsx` : Stripe ajouté en section 6.

---

## 2. Le problème

L'intégration ci-dessus ne gère QUE l'abonnement local de l'organisation
Tax dans la base cgi-242. Or l'accès aux 5 produits NORMX (Tax, Compta,
Paie, États, Legal) est gouverné par un attribut Keycloak partagé
`subscribed_products` (CSV `"tax,compta,paie"`), lu dans le JWT par
chaque app :
- `cgi-242/server/src/middleware/keycloak-auth.ts:55`
- `normx/server/middleware/auth.ts:52`

Le commentaire dans `cgi-242/server/src/app.ts:128-135` confirme
l'intention : « subscribed_products qui devrait etre ajoute par le
webhook Stripe a chaque achat ».

Conséquence : tant que le webhook Stripe ne met pas à jour
`subscribed_products` côté Keycloak, les souscriptions par carte
n'ouvrent l'accès à aucun produit pour les autres apps NORMX. Et la
mise en place actuelle n'a pas accès à Keycloak Admin API.

---

## 3. Architecture cible

```
┌─────────────────┐
│  Mobile / Web   │  abonnement.tsx → choix produit + période
│  (toutes apps)  │
└────────┬────────┘
         │ POST /api/stripe/checkout (auth Keycloak)
         ▼
┌─────────────────────────┐
│  Backend billing        │  un seul backend porte Stripe
│  (proposition: cgi-242) │
└────────┬────────────────┘
         │ Stripe Checkout
         ▼
   ╔══════════╗
   ║  Stripe  ║  ──── webhook ────▶  /api/stripe/webhook
   ╚══════════╝                          │
                                          ▼
                              ┌───────────────────────────┐
                              │  Webhook handler          │
                              │  1. Met a jour Subscription│
                              │     locale (cgi-242 si tax)│
                              │  2. PATCH user attribute  │
                              │     subscribed_products    │
                              │     via Keycloak Admin API │
                              └───────┬───────────────────┘
                                      │
                                      ▼
                            ┌──────────────────┐
                            │  Keycloak        │  attribut user mis a jour
                            │  realm normx     │  -> JWT regenere au refresh
                            └──────────────────┘
                                      │
              JWT contient subscribed_products="tax,compta"
                                      │
              ┌───────────────┬───────┴───────┬───────────────┐
              ▼               ▼               ▼               ▼
        ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
        │  Tax    │    │  Compta  │    │  Paie    │    │  Legal   │
        │ cgi-242 │    │  normx   │    │  normx   │    │  normx-  │
        │  API    │    │   API    │    │   API    │    │  legal   │
        └─────────┘    └──────────┘    └──────────┘    └──────────┘
```

---

## 4. Décisions à trancher

### A. Où vit le service de billing ?

- A1. **Dans cgi-242** (recommandé). Avantages : déjà structuré, l'intégration
  Stripe est prête. Inconvénient : un repo « tax » qui sert d'API billing
  pour Compta/Paie/États/Legal — couplage fonctionnel discutable.
- A2. **Dans normx-legal** ou normx. Mêmes arguments inversés.
- A3. **Dans un nouveau micro-service `billing`** (repo `normx-ai/billing`).
  Plus propre architecturalement, mais nouveau service à déployer + nouveau
  domaine `billing.normx-ai.com` + GitHub Actions à monter. Plus long.
- A4. **Dans `infra`** (mauvaise idée — infra ne porte pas de logique métier).

### B. Quel écran porte la souscription ?

- B1. **L'écran abonnement de cgi-242** sert de portail unifié et propose
  les 5 produits. Les autres apps redirigent vers cet écran (ou affichent
  un lien). Cohérent si A1.
- B2. **Chaque app a son propre écran** qui appelle le backend central.
  Plus de duplication UI mais respecte la séparation des produits.

### C. Modèle d'abonnement Stripe

- C1. **Un Subscription Stripe par produit** (5 abonnements possibles
  côté Stripe pour un même Customer). Souple, on peut souscrire Tax sans
  Compta. Webhook reçoit `customer.subscription.updated` par produit et
  ajoute/retire le code produit du CSV `subscribed_products`.
- C2. **Un Subscription multi-line-items** (un seul abonnement, plusieurs
  Price). Plus simple en facturation mais on perd la granularité par produit.
- C3. **Plans bundles** (tarif unique « Suite NORMX » qui débloque tout).
  Simple à vendre, complexe à mapper si l'utilisateur veut juste Tax.

### D. Granularité de l'attribut Keycloak

- D1. `subscribed_products = "tax,compta,paie"` (existant) — niveau user.
- D2. Étendre à `"tax:pro,compta:pro,paie:starter"` pour porter le plan
  par produit (utile si chaque produit a Free/Pro/Enterprise).
- D3. Garder l'accès dans Keycloak (gating) ET stocker le plan dans la
  base de chaque app (pour les quotas locaux). C'est ce que fait déjà
  cgi-242 avec son modèle `Subscription`. À répliquer pour normx-legal,
  pas nécessaire pour normx (pas de quotas locaux pour le moment).

---

## 5. Implémentation cible (une fois A/B/C/D tranchés)

Ces étapes sont à exécuter dans l'ordre.

### 5.1 Catalogue Stripe (à faire dans le dashboard)
- Créer 5 Products : `NORMX Tax`, `NORMX Compta`, `NORMX Paie`,
  `NORMX États`, `NORMX Legal`.
- Pour chaque Product, créer 2 Prices : mensuel et annuel.
- Récupérer les 10 Price IDs.

### 5.2 Backend billing
- Étendre `config/stripe.ts` :
  ```ts
  type ProductCode = "tax" | "compta" | "paie" | "etats" | "legal";
  const PRODUCT_PRICES: Record<ProductCode, { monthly: string; yearly: string }>
  ```
- Étendre `services/stripe.service.ts` :
  - `createCheckoutSession({userId, product, period, customerEmail})`.
  - Stocker `metadata: { userId, product, period }` sur la session et le
    Subscription Stripe.
- Ajouter Keycloak Admin client : `npm i @keycloak/keycloak-admin-client`,
  config `KEYCLOAK_ADMIN_CLIENT_SECRET`, helper
  `addProductToUser(userId, product)` et `removeProductFromUser(userId, product)`.
- Webhook :
  - `checkout.session.completed` → ajout produit dans Keycloak + (si tax)
    `activateSubscription` local.
  - `customer.subscription.deleted` → retrait produit dans Keycloak +
    downgrade Subscription local éventuel.
  - `invoice.payment_failed` → marquer PAST_DUE local + email.

### 5.3 Frontend cgi-242
- Refonte `abonnement/index.tsx` : grille des 5 produits avec statut
  (souscrit / non souscrit) et boutons « Souscrire mensuel / annuel »
  qui appellent `stripeApi.createCheckoutSession({product, period})`.
- Affichage de la liste des produits actifs lue dans le JWT.

### 5.4 Frontend autres apps (normx, normx-legal)
- Si l'utilisateur n'a pas le produit dans son JWT, afficher un écran
  « Souscrire à NORMX X » avec deep-link vers
  `https://app.normx-ai.com/abonnement?product=X`.

### 5.5 Documents légaux
- CGU/CGV cgi-242 (déjà en place pour Tax) à mettre à jour pour citer
  les 5 produits dans les conditions financières.
- Répliquer CGU/CGV/Mentions/Confidentialité dans normx-legal mobile
  (actuellement absent).

### 5.6 Tests
- Endpoint test `/api/stripe/checkout` avec Stripe CLI (`stripe listen`).
- Test webhook avec carte test `4242 4242 4242 4242`.
- Vérifier la mise à jour de l'attribut Keycloak après checkout.

---

## 6. Travaux annexes liés

- Rouler la clé Stripe `sk_test_*` qui a fuité dans le chat (en attente).
- Provisionner l'alias mail `dpo@normx-ai.com` côté MX.
- Vérifier l'inscription Anthropic au DPF sur dataprivacyframework.gov
  (TIA cite « avril 2026 »).
- Désigner un médiateur de la consommation (CGV article 17 actuellement
  « en cours de désignation »).

---

## 7. Effort estimé

| Tâche | Effort |
|---|---|
| Catalogue Stripe (10 Prices) | 30 min dashboard |
| Backend : refonte stripe.service.ts pour produits | 2-3 h |
| Backend : Keycloak Admin client + sync attribut | 3-4 h |
| Backend : tests unitaires + intégration | 2 h |
| Frontend cgi-242 : grille produits | 2-3 h |
| Frontend normx/normx-legal : écran « souscrire » | 2 h chacun |
| CGU/CGV : adaptation 5 produits | 1 h |
| Documentation + tests E2E | 2 h |
| **Total** | **~ 2 jours** |
