# Table de gestion des obligations — Admin UI

Interface dans cgi-242 pour permettre à un administrateur (fiscaliste de
référence ou super-admin NORMX) de gérer le catalogue des obligations
fiscales du CGI Congolais sans toucher à la base de données.

État : v1 livrée le 26 avril 2026 (commits `ad508b6` backend + `e4f6f63`
front). Voir section « Statut d'implémentation » à la fin du document
pour ce qui est en place vs ce qui est à faire.

---

## Pourquoi une UI plutôt qu'un seed code ?

- Le catalogue change chaque année avec la loi de finances (taux, seuils,
  dates qui bougent). Le fiscaliste doit pouvoir mettre à jour sans dev.
- Validation par les yeux d'un humain compétent à la saisie : on ne
  stocke jamais une obligation inventée par un développeur.
- Versionning par année (`version: "2025"`, `"2026"`) gérable depuis
  l'interface : on duplique l'année précédente et on amende.

---

## Pages et composants

### Page 1 — Liste des obligations [LIVRÉ]
URL : `/admin/obligations`

Tableau (en réalité liste de cards mobile-friendly) avec ces colonnes :
- Code (ITS, TVA, IS, MP, CFPB, patente…)
- Libellé court
- Catégorie (badge couleur, reprend `AlerteCategorie`)
- Périodicité (mensuelle, annuelle…)
- Aperçu de la règle d'échéance en français
- Article CGI (lien vers la fiche article dans la KB)
- Simulateur lié
- Toggle actif/inactif

Filtres en haut :
- Par version (input texte, défaut 2026)
- Par catégorie (chips horizontaux scrollables, toutes les catégories de
  l'enum `AlerteCategorie`)
- Par périodicité (chips)
- Par état (chip « Actives uniquement » / « Inclut inactives »)
- Champ recherche libre (code + libellé, recherche serveur)

Actions par ligne : Modifier (icône crayon), Désactiver/Réactiver
(icône œil).
Action globale : Nouvelle obligation (bouton or), Cloner version (lien
texte), Aide depuis les alertes (icône ampoule).

### Page 2 — Formulaire création / édition [LIVRÉ]
URL : Modale plein écran ouverte depuis la liste

Formulaire en 5 sections (cards) :

#### 2.1 Identité
- Code (input, contrainte unique par version) — ex. ITS, TVA, IS, MP
- Libellé (input)
- Description (textarea, optionnel)
- Catégorie (chips horizontaux, toutes les valeurs de `AlerteCategorie`)
- Version (héritée du contexte, modifiable côté liste)

#### 2.2 Échéance
- Périodicité (chips horizontaux : mensuelle, bimensuelle, trimestrielle,
  semestrielle, annuelle, ponctuelle)
- Selon la périodicité choisie, le formulaire affiche les bons champs :
  - Mensuelle : « Jour du mois » (1-31 ou « last »)
  - Trimestrielle : mois concernés (CSV : `3,6,9,12`) + jour
  - Semestrielle : 2 mois (CSV : `6,12`) + jour
  - Annuelle : mois (1-12) + jour
  - Ponctuelle : description libre du déclencheur
- Lors du changement de périodicité, la règle est réinitialisée avec une
  valeur par défaut sensée.

#### 2.3 Applicabilité
Pour la v1, c'est un éditeur JSON simple avec exemples affichés en
helper. Le constructeur cliquable de règles est prévu pour la v2 (voir
TODO).

Exemples affichés dans l'aide :
- ITS → `{ "salaries_count": { "min": 1 } }`
- CFPB → `{ "possede_foncier_bati": true }`
- TVA réel → `{ "regime_tva": "reel" }`
- Vide / `{}` → applicable à toutes les entités.

Validation JSON au moment de l'enregistrement : si invalide, toast
d'erreur et le formulaire reste ouvert.

#### 2.4 Référence légale [LIVRÉ avec autocomplete]
- Article CGI : input avec autocomplete connecté à la table `articles`
  existante via `GET /api/obligations/articles-recherche?q=`. Quand
  l'admin tape « 277 », le système propose « Art. 277 — Patente, Champ
  d'application ». Sélection → `articleNumero` et `articleId` remplis
  ensemble.
- Numéro affiché en clair (`articleNumero`) pour ne pas casser si
  l'article est mis à jour.

#### 2.5 Calcul [LIVRÉ]
- Simulateur lié (chips horizontaux parmi les 16 simulateurs déjà en
  place — liste retournée par `GET /api/obligations/simulateurs`) :
  patente, is, is-parapetrolier, its, tva, ircm, iba, igf, irf-loyers,
  contribution-fonciere, taxe-immobiliere, cession-parts, enregistrement,
  solde-liquidation, retenue-source, paie.
- Indique au système quel simulateur ouvrir quand l'utilisateur clique
  « Calculer » sur un dossier de cette obligation (à exploiter dans le
  Bloc 4.1 du roadmap dashboard).

#### 2.6 Présentation
- Ordre d'affichage (number, défaut 100) — permet de regrouper les
  obligations dans le calendrier.
- Actif (checkbox) — désactive sans supprimer (audit trail conservé).

Boutons en bas :
- Annuler (croix dans le header)
- Enregistrer (header, gros bouton or)

### Page 3 — Aperçu / test d'une obligation [À FAIRE — v2]

Permet à l'admin de simuler l'application de la règle sur des profils
fictifs ou réels. Pas implémenté en v1, attend le bloc « Modèle entité
fiscale » (Bloc 1.2 du roadmap).

### Page 4 — Versionning par année fiscale [LIVRÉ partiellement]

Action « Cloner version » disponible depuis la liste : duplique tout le
catalogue de la version active vers la version suivante (incrément +1).
- Backend : `POST /api/obligations/cloner-version` avec idempotence (si
  la version cible contient déjà des obligations, le clone est annulé).
- Front : confirmation modale avant clonage.

Pas encore livré : page dédiée listant toutes les versions et permettant
de basculer la version active. À ajouter quand on aura plusieurs années
en production.

---

## Aide depuis les alertes existantes [LIVRÉ — différencie cette UI]

Bouton ampoule dans le header de la liste → ouvre le panneau
`AlertesAidePanel`. Affiche les `AlerteFiscale` déjà extraites du CGI
par le moteur NLP, groupées par catégorie. Cliquer sur une alerte
pré-remplit le formulaire « Nouvelle obligation » avec les champs déduits :
- titre → libellé
- description → description
- categorie → catégorie
- articleNumero → référence légale

Cela évite à l'admin de retaper depuis zéro, et garantit qu'on s'appuie
sur les données réelles de la plateforme.

Endpoint dédié : `GET /api/obligations/alertes-aide` qui renvoie les
alertes filtrées sur `type IN (ECHEANCE, OBLIGATION)` et `actif=true`,
groupées par `categorie`.

---

## Sécurité et permissions

- Routes API CRUD protégées par `requireAuth + requireAdmin` côté serveur.
- La liste et le détail (GET) sont accessibles à tout utilisateur
  authentifié — utile car les autres modules (calendrier, dossiers)
  liront le catalogue en lecture pour calculer les obligations
  applicables à chaque entité.
- L'écriture (POST, PATCH, désactiver, cloner) est réservée aux
  administrateurs uniquement.
- Toutes les modifications loggées via `logger.info` côté service. Le
  rattachement à la table `audit_log` peut être ajouté en v2.
- Aucune suppression dure : `actif=false` pour archiver, jamais de DELETE.

---

## Statut d'implémentation

| Élément | Statut | Commit |
|---|---|---|
| Modèle Prisma `Obligation` + enum `ObligationPeriodicite` | ✓ Livré | `960cb0e` |
| Migration SQL `add_obligations_catalog` | ✓ Livré | `960cb0e` |
| Service `obligations.service.ts` (CRUD + helpers) | ✓ Livré | `ad508b6` |
| Schémas Zod de validation | ✓ Livré | `ad508b6` |
| Routes Express `/api/obligations` | ✓ Livré | `ad508b6` |
| Endpoint `alertes-aide` (lecture AlerteFiscale) | ✓ Livré | `ad508b6` |
| Endpoint `articles-recherche` (autocomplete KB) | ✓ Livré | `ad508b6` |
| Endpoint `simulateurs` (codes mobile) | ✓ Livré | `ad508b6` |
| Endpoint `cloner-version` | ✓ Livré | `ad508b6` |
| API client mobile `obligations.ts` (types stricts) | ✓ Livré | `e4f6f63` |
| Page liste `/admin/obligations` avec filtres | ✓ Livré | `e4f6f63` |
| Modale formulaire 5 sections + champs adaptatifs | ✓ Livré | `e4f6f63` |
| Panneau `AlertesAidePanel` | ✓ Livré | `e4f6f63` |
| Documentation `admin-obligations-ui.md` à jour | ✓ Livré | (ce commit) |
| Constructeur cliquable de règles d'applicabilité | À faire | v2 |
| Page Aperçu / test d'une obligation | ✓ Livré | `5e506ee` — modal `TestApplicabiliteModal` + endpoint `/api/obligations/:id/tester-applicabilite` |
| Page dédiée Versionning (liste des versions) | À faire | v2 |
| Audit trail dans `audit_log` | À faire | v2 |
| Lien depuis la sidebar Admin vers `/admin/obligations` | ✓ Livré | `7e53fe8` |
| Grille d'outils administrateur (Catalogue, Analytics, Audit, Permissions) | ✓ Livré | `523ff6b` |
| Card « Mes entités fiscales » dans le hub admin | ✓ Livré | `895cafa` |
| Moteur d'applicabilité qui consomme `obligation.applicabilite` | ✓ Livré | `76b0f9f` |
| Génération automatique des dossiers via `genererPeriodes(echeanceRule)` | ✓ Livré | `76b0f9f` |
| Endpoint `POST /api/dossiers/recalculer` | ✓ Livré | `76b0f9f` |
| Recalcul auto des dossiers à la création/modif d'une entité | ✓ Livré | `2c8b5cd` |
| Schéma Zod `applicabilite` strictement typé (zéro `any`/`unknown`) | ✓ Livré | `7354e63` |

---

## Prochaines étapes immédiates

1. ~~Ajouter le lien « Obligations » dans la sidebar admin~~ ✓ Fait
   dans `7e53fe8` puis enrichi dans `523ff6b`.
2. Quand un fiscaliste valide la première saisie d'une obligation,
   s'assurer que la mise en prod côté server applique bien les
   migrations (auto via Dockerfile `prisma migrate deploy`).
3. ~~Démarrer Bloc 1.2~~ ✓ Fait dans `3bc8cf0` + `895cafa`.
4. ~~Démarrer Phase 2 (moteur applicabilité + dossiers)~~ ✓ Fait dans
   `76b0f9f` (backend) + `2c8b5cd` (KPIs dashboard branchés).
5. Saisie effective du catalogue d'obligations par un fiscaliste —
   c'est l'opération qui débloque tout le reste de la chaîne.
6. Items v2 restants : constructeur cliquable de règles, page
   aperçu/test d'obligation, page versions dédiée, audit trail.
