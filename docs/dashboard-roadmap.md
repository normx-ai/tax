# Dashboard NORMX TAX — Roadmap d'implémentation

Cap : transformer cgi-242 d'un outil de simulation/référence en plateforme de
gestion fiscale (suivi des obligations + simulateurs + IA), pour entreprise
mono-entité ET cabinet multi-clients.

L'ordre des blocs reflète la valeur utilisateur perçue (du plus structurant
au plus enrichissant). Chaque bloc débloque les suivants.

---

## Phase 1 — Fondations data (sans elles, rien ne fonctionne)

### Bloc 1.1 — Catalogue des obligations fiscales [LIVRÉ — 26 avril 2026]

Schéma + UI admin + intégration au dashboard admin livrés. Reste à
remplir le catalogue avec les obligations réelles du CGI Congo via
l'UI (par un fiscaliste). Voir `docs/admin-obligations-ui.md` pour le
détail commit-par-commit.

Modèle Prisma `Obligation` (table `obligations`) :
- `code` (ITS, TVA, IS, MP, CFPB, patente…) unique par version
- `libelle` + `description`
- `categorie` (réutilise enum `AlerteCategorie` existant)
- `periodicite` (MENSUELLE, BIMENSUELLE, TRIMESTRIELLE, SEMESTRIELLE,
  ANNUELLE, PONCTUELLE)
- `echeanceRule` (JSON, discriminated union sur `type` :
  monthly / yearly / quarterly / semestriel / ponctuelle)
- `applicabilite` (JSON, règles évaluées par le moteur)
- `articleNumero` + `articleId` (lien vers la KB articles existante)
- `simulateurCode` (référence vers les 16 simulateurs mobile existants)
- `version` (par année fiscale, défaut 2026), `actif`, `ordre`

API `/api/obligations` :
- CRUD complet (admin uniquement sauf GET)
- `cloner-version` : duplique tout vers une nouvelle année (loi de
  finances)
- `alertes-aide` : lit `AlerteFiscale` existantes pour pré-remplir
- `articles-recherche` : autocomplete sur la KB CGI
- `simulateurs` : liste des codes simulateurs mobile

UI admin `/admin/obligations` :
- Liste filtrée + bouton Nouvelle/Cloner version
- Formulaire en 5 sections avec champs adaptatifs selon périodicité
- Panneau d'aide affichant les alertes déjà extraites du CGI

Effort réalisé : ~2 jours dev + saisie en cours par fiscaliste.

### Bloc 1.2 — Modèle entité fiscale [LIVRÉ — 26 avril 2026]

Schéma Prisma + migration + API REST + UI mobile livrés. Voir commits
`3bc8cf0` (backend) et `895cafa` (frontend).

Reste à saisir les premières entités via l'UI `/entites` pour activer le
moteur d'applicabilité (Bloc 2.1).



Une entité = un client (cabinet) ou l'entreprise elle-même. Champs minimaux
pour déterminer l'applicabilité des obligations :

- Identité : raison sociale, NIU, RCCM, adresse
- Forme juridique (SARL, SA, SAS, EI…)
- Secteur d'activité — voir liste fermée alignée sur les 16 conventions
  collectives congolaises ci-dessous
- Régime IS (réel normal, réel simplifié, micro)
- Assujettissement TVA (oui/non/franchise)
- Salariés (oui/non, effectif)
- Possession foncier bâti / non bâti
- CA estimé année en cours
- Date de création / clôture exercice

Liste fermée des secteurs d'activité — alignée sur les conventions
collectives sectorielles congolaises (16 conventions) déjà ingérées
côté `mobile/data/social/conventions/` et `server/data/social/2026/conventions/`.
Cette correspondance permet de lier directement un client à sa
convention applicable, ce qui sert ensuite côté paie (calcul ITS/TUS
et cotisations CNSS/CAMU spécifiques par secteur) et côté fiscal
(certaines obligations comme la patente ont des barèmes sectoriels).

| Code interne | Libellé | Convention collective |
|---|---|---|
| `aerien` | Transport aérien | Convention Collective Aérien |
| `agri_foret` | Agriculture, élevage, forêt | CC Agri-Forêt |
| `auxiliaires_transport` | Auxiliaires de transport | CC Auxiliaires Transport |
| `bam` | Banques, Assurances, Mutuelles | CC BAM |
| `btp` | Bâtiment et Travaux Publics | CC BTP |
| `commerce` | Commerce | CC Commerce |
| `exploitation_miniere` | Exploitation minière | CC Exploitation Minière |
| `forestiere` | Forestière | CC Forestière |
| `hotellerie_catering` | Hôtellerie, restauration, catering (HCR) | CC HCR |
| `industrie` | Industrie | CC Industrie |
| `information_communication` | Information et communication | CC IC |
| `ntic` | NTIC | CC NTIC |
| `para_petrole` | Para-pétrole | CC Para-Pétrole |
| `peche_maritime` | Pêche maritime | CC Pêche Maritime |
| `personnel_domestique` | Personnel domestique | CC Personnel Domestique |
| `petrole` | Pétrole | CC Pétrole |

Conséquences pratiques :
- Le champ `secteur_activite` sera un enum strict côté Prisma avec ces
  16 valeurs, pas une chaîne libre. Évite les saisies divergentes.
- Le moteur d'applicabilité pourra utiliser ces codes dans les règles
  JSON des obligations (`{"secteurs_inclus": ["hotellerie_catering"]}`
  pour une taxe HCR par exemple).
- Côté paie (Bloc à venir), on retrouvera la même valeur pour appliquer
  la grille salariale conventionnelle correcte.

Effort : 1,5 jour modèle (incluant l'enum sectoriel et les liens
optionnels vers la convention) + 1 jour formulaire de saisie.

### Bloc 1.3 — Mode entreprise vs cabinet [LIVRÉ — 26 avril 2026]

À l'inscription, choix unique :
- **Entreprise** : 1 entité (la sienne), créée automatiquement
- **Cabinet** : plusieurs entités clients à ajouter au fur et à mesure

Implémenté côté backend dans le commit `de455e0` :
- enum `OrganizationMode` (ENTREPRISE | CABINET) sur Organization
- Migration `add_organization_mode` (défaut ENTREPRISE)
- Schémas Zod (createOrgBody, updateOrgBody) acceptent le champ
- Type côté API client mobile

Reste à faire côté UX (à intégrer dans la refonte dashboard quand on
remplira les KPIs réels) : modal d'onboarding « Êtes-vous une entreprise
ou un cabinet ? » au premier connect d'une nouvelle organisation, et
adaptation du dashboard selon le mode.

---

## Phase 2 — Génération automatique du calendrier

### Bloc 2.1 — Moteur d'applicabilité [LIVRÉ — 26 avril 2026]

Pour chaque entité, on évalue les règles `applicabilite` du catalogue
d'obligations. Output : la liste des obligations applicables à l'entité, avec
leur prochaine échéance calculée.

Exemple concret : entreprise HCR avec 8 salariés, régime réel simplifié, CA
estimé 80 M FCFA, possède un local commercial bâti :
- ITS mensuel ✓ (employeur)
- TUS mensuel ✓ (employeur)
- IRCM mensuel ✓
- TVA mensuelle ✗ (CA < seuil, en franchise)
- CNSS mensuel ✓
- CAMU mensuel ✓
- IS annuel ✓ (le 30 avril N+1)
- Patente annuelle ✓
- CFPB annuelle ✓ (foncier bâti)
- CFPNB ✗

Effort : 2 jours (moteur + tests par persona).

### Bloc 2.2 — Table `dossiers` (instances d'obligation) [LIVRÉ — 26 avril 2026]

Pour chaque (entité × obligation × période), on crée un `dossier` avec :
- statut (`a_faire`, `en_cours`, `pret`, `depose`, `paye`, `en_retard`)
- date d'échéance
- montant calculé (issu du simulateur)
- pièces justificatives jointes
- date de dépôt effective
- date de paiement
- notes

Auto-création des dossiers pour les 12 prochains mois lors de l'inscription
(et chaque mois ensuite via cron).

Effort : 1,5 jour (modèle + cron + transitions de statut).

---

## Phase 3 — Dashboard et UX

État global Phase 3 : squelette livré le 26 avril 2026 (commit
`beded41`) selon l'option « Build it now, données plus tard ». Le
nouveau dashboard est visible immédiatement sur la page d'accueil
mobile/web. Les blocs 3.x ci-dessous sont chacun livrés en surface,
mais leurs données réelles attendent les Phase 2 et 4.

### Bloc 3.1 — Bandeau « Prochaine échéance » [LIVRÉ partiel]

Le composant le plus visible. Affiche la première obligation à échéance dans
les 30 jours, avec :
- countdown (« dans 4 jours »)
- progress bar (X/Y dossiers prêts en mode cabinet, ou X/Y étapes faites en
  mode entreprise)
- bouton « Continuer » qui mène directement à la liste des dossiers en attente

Effort : 0,5 jour.

### Bloc 3.2 — KPIs utilisateur [LIVRÉ squelette]

4 cards en haut du dashboard, métriques différentes selon le mode :

**Mode entreprise :**
- Simulations effectuées ce mois
- Économie identifiée (somme des écarts simulés vs régime actuel)
- Obligations en retard
- Taux de complétion des obligations du mois

**Mode cabinet :**
- Clients suivis
- Dossiers prêts ce mois (sur total)
- Clients en retard
- Économie totale identifiée (somme sur tous les clients)

Effort : 1 jour (queries d'agrégation + composant card).

### Bloc 3.3 — Liste des échéances [LIVRÉ partiel]

Groupée par date, scrollable, avec filtre passé/présent/futur. Pour chaque
date :
- Liste des obligations à cette échéance
- Compteur dossiers prêts / total
- Lien vers les dossiers en attente

Effort : 1 jour.

### Bloc 3.4 — Activité récente [LIVRÉ placeholder]

Timeline des dernières simulations, dépôts, calculs avec montant et entité
concernée. Permet de revenir rapidement sur un travail en cours.

Effort : 0,5 jour.

---

## Phase 4 — Intégrations

### Bloc 4.1 — Simulateurs ↔ Dossiers

Quand un utilisateur fait un calcul dans un simulateur (patente, IS, TVA…),
on lui propose : « Enregistrer ce calcul dans le dossier [Patente 2026 –
DAISY DEL] ? ». Si oui, le montant est stocké, le statut passe à `pret`,
l'historique d'activité s'enrichit.

Effort : 1 jour (UI dans chaque simulateur + persistance).

### Bloc 4.2 — Notifications / rappels

- In-app : badge sur l'icône bell (déjà présente) avec compteur d'obligations
  proches d'échéance ou en retard
- Email : J-7, J-3, J-1 avant échéance, et J+1 si pas marquée comme déposée

Effort : 1,5 jour (worker email + composant notif).

### Bloc 4.3 — Documents joints

Upload de pièces justificatives sur chaque dossier (facture foncière, bulletin
salaire, balance comptable). Stockage S3-compatible.

Effort : 1 jour si infra S3 existe déjà, sinon +1 jour.

---

## Phase 5 — IA et différenciation

### Bloc 5.1 — IA Insights contextuelles

Moteur qui analyse le profil et l'historique de l'entité pour suggérer :
- Optimisations fiscales (« passer en régime PME économiserait X FCFA »)
- Échéances oubliées (« 3 clients HCR n'ont pas déposé la CFPB »)
- Anomalies (« l'IS calculé semble disproportionné par rapport au CA »)

Implémentation : prompt structuré envoyé à Claude avec contexte entité +
obligations + simulations récentes.

Effort : 2-3 jours (prompt engineering + UI + intégration).

### Bloc 5.2 — Assistant IA fiscal (déjà partiellement présent)

Enrichir le chat IA existant avec accès aux dossiers de l'utilisateur : « Que
me reste-t-il à faire ce mois-ci ? », « Combien j'économiserais en passant en
régime PME ? », « Liste-moi les clients en retard sur la CFPB. »

Effort : 1-2 jours (function calling sur les tables dossiers/entités).

---

## Récapitulatif effort total

| Phase | Bloc | Effort | Statut |
|---|---|---|---|
| 1 | 1.1 — Catalogue obligations | 2,5 j (réalisé) | ✓ Livré (26/04/2026) — schéma, API, UI admin, navigation |
| 1 | 1.2 — Modèle entité fiscale | 2,5 j (réalisé) | ✓ Livré (26/04/2026) — schéma + API + UI list/form |
| 1 | 1.3 — Mode entreprise/cabinet | 0,3 j (réalisé) | ✓ Livré (26/04/2026) — champ Organization.mode + API |
| 2 | 2.1 — Moteur applicabilité | 1 j (réalisé) | ✓ Livré (26/04/2026) — services + tests inline |
| 2 | 2.2 — Table dossiers | 1 j (réalisé) | ✓ Livré (26/04/2026) — modèle + API + recalcul auto |
| 3 | 3.1 — Bandeau prochaine échéance | 0,3 j (réalisé) | ✓ Livré (26/04/2026) — squelette avec données calendrier-fiscal existant |
| 3 | 3.2 — KPIs utilisateur | 0,5 j (réalisé partiellement) | ⚠ Squelette livré, valeurs réelles attendent Phase 2 |
| 3 | 3.3 — Liste des échéances | 0,5 j (réalisé) | ✓ Livré (26/04/2026) — par mois courant |
| 3 | 3.4 — Activité récente | 0,2 j (réalisé) | ⚠ Placeholder livré, données attendent Bloc 4.1 |
| 4 | 4.1 — Simulateurs ↔ Dossiers | 1 j | À faire |
| 4 | 4.2 — Notifications / rappels | 1,5 j | À faire |
| 4 | 4.3 — Documents joints | 1 j | À faire |
| 5 | 5.1 — IA Insights | 2-3 j | À faire |
| 5 | 5.2 — Assistant IA fiscal enrichi | 1-2 j | À faire |

Réalisé à date (26 avril 2026) : 7,3 jours
- Bloc 1.1 (catalogue obligations) : 2,5 j
- Bloc 1.2 (modèle entité) : 2,5 j
- Bloc 1.3 (mode entreprise/cabinet) : 0,3 j (backend uniquement)
- Phase 3 squelette (3.1, 3.2 partiel, 3.3, 3.4 placeholder) : ~1,5 j
  enchassés dans le total ci-dessus
- Bloc 2.1 (moteur applicabilité) : 1 j
- Bloc 2.2 (table dossiers + recalcul auto + KPIs branchés) : 1 j

Backfill production des modes (26 avril 2026, opération SQL directe)
- CABINET : Cédron Ngamiye (avec Douce Moussavou en ADMIN, son org
  perso soft-deletée), Fresnay MAKOUESSE (cabinet séparé), NORMX AI
- ENTREPRISE : Claver BATCHI, Diasthene Merveilles, Excelle
  Louboungou, Franck BIKEDI, Genia MOUSSOYI, MMA CONSULTING SA
  (mecene), SANA Hygiène et services
- Cas particulier : Cédron + Douce dans le même cabinet (cabinet de
  Cédron). Cédron OWNER, Douce ADMIN. L'organisation perso de Douce
  a été soft-supprimée (deletedAt) — elle n'a plus que le cabinet en
  accès.

Reste à faire : ~10,7 jours
- Phase 4 complète (intégrations simulateur ↔ dossiers, notifications, documents joints) : 3,5 j
- Phase 5 (IA Insights + Assistant fiscal enrichi) : 4 j
- Renforcement UX dashboard (page liste dossiers détaillée, activité récente, modal onboarding mode) : ~3 j

Le dashboard tax affiche désormais des chiffres RÉELS (Clients suivis,
Obligations du mois, En retard, Complétion %), tirés de
`/api/dossiers/kpis`. Les KPIs deviennent significatifs dès qu'un
fiscaliste saisit son catalogue d'obligations + une entité — le
moteur d'applicabilité génère automatiquement les dossiers à venir.

Estimation **2 à 3 semaines de dev** restants pour avoir un dashboard
vraiment alimenté en données.

---

## Décisions à prendre avant de démarrer

1. Mode entreprise ET cabinet ou seulement un des deux pour le MVP ?
2. Liste finale des ~20-25 obligations à modéliser dans le catalogue (à
   valider avec un fiscaliste congolais ; on a déjà le CGI 242 en KB)
3. Backend : étendre le serveur Express tax actuel ou créer un service
   dédié « tax-suivi » ?
4. Stockage des pièces justificatives : S3, MinIO local, autre ?
5. Persona prioritaire pour la première version : cabinet ou entreprise ?
   (ça oriente le sourcing utilisateur pour les retours)
