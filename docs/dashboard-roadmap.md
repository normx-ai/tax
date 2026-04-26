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

### Bloc 1.2 — Modèle entité fiscale

Une entité = un client (cabinet) ou l'entreprise elle-même. Champs minimaux
pour déterminer l'applicabilité des obligations :

- Identité : raison sociale, NIU, RCCM, adresse
- Forme juridique (SARL, SA, SAS, EI…)
- Secteur d'activité (HCR, BTP, services, commerce…)
- Régime IS (réel normal, réel simplifié, micro)
- Assujettissement TVA (oui/non/franchise)
- Salariés (oui/non, effectif)
- Possession foncier bâti / non bâti
- CA estimé année en cours
- Date de création / clôture exercice

Effort : 1 jour modèle + 1 jour formulaire de saisie.

### Bloc 1.3 — Mode entreprise vs cabinet

À l'inscription, choix unique :
- **Entreprise** : 1 entité (la sienne), créée automatiquement
- **Cabinet** : plusieurs entités clients à ajouter au fur et à mesure

Le mode pilote l'affichage du dashboard, la navigation, les agrégations. Pas
de bascule possible après inscription (ou alors avec une action explicite).

Effort : 0,5 jour (logique de routing + onboarding différencié).

---

## Phase 2 — Génération automatique du calendrier

### Bloc 2.1 — Moteur d'applicabilité

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

### Bloc 2.2 — Table `dossiers` (instances d'obligation)

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

### Bloc 3.1 — Bandeau « Prochaine échéance »

Le composant le plus visible. Affiche la première obligation à échéance dans
les 30 jours, avec :
- countdown (« dans 4 jours »)
- progress bar (X/Y dossiers prêts en mode cabinet, ou X/Y étapes faites en
  mode entreprise)
- bouton « Continuer » qui mène directement à la liste des dossiers en attente

Effort : 0,5 jour.

### Bloc 3.2 — KPIs utilisateur

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

### Bloc 3.3 — Liste des échéances

Groupée par date, scrollable, avec filtre passé/présent/futur. Pour chaque
date :
- Liste des obligations à cette échéance
- Compteur dossiers prêts / total
- Lien vers les dossiers en attente

Effort : 1 jour.

### Bloc 3.4 — Activité récente

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
| 1 | 1.2 — Modèle entité fiscale | 2 j | À faire |
| 1 | 1.3 — Mode entreprise/cabinet | 0,5 j | À faire |
| 2 | 2.1 — Moteur applicabilité | 2 j | À faire |
| 2 | 2.2 — Table dossiers | 1,5 j | À faire |
| 3 | 3.1 — Bandeau prochaine échéance | 0,5 j | À faire |
| 3 | 3.2 — KPIs utilisateur | 1 j | À faire |
| 3 | 3.3 — Liste des échéances | 1 j | À faire |
| 3 | 3.4 — Activité récente | 0,5 j | À faire |
| 4 | 4.1 — Simulateurs ↔ Dossiers | 1 j | À faire |
| 4 | 4.2 — Notifications / rappels | 1,5 j | À faire |
| 4 | 4.3 — Documents joints | 1 j | À faire |
| 5 | 5.1 — IA Insights | 2-3 j | À faire |
| 5 | 5.2 — Assistant IA fiscal enrichi | 1-2 j | À faire |

Reste à faire : ~17 jours sur ~19,5 jours initialement estimés.
Estimation **3 à 4 semaines de dev** restants.

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
