# Table de gestion des obligations — Admin UI

Interface dans cgi-242 pour permettre à un administrateur (fiscaliste de
référence ou super-admin NORMX) de gérer le catalogue des obligations
fiscales du CGI Congolais sans toucher à la base de données.

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

### Page 1 — Liste des obligations
URL : `/admin/obligations`

Tableau triable avec ces colonnes :
- Code (ITS, TVA, IS, MP, CFPB, patente…)
- Libellé court
- Catégorie (badge couleur, reprend `AlerteCategorie`)
- Périodicité (mensuelle, annuelle…)
- Prochaine échéance (calculée pour aujourd'hui)
- Article CGI (lien vers la fiche article dans la KB)
- Simulateur lié (lien vers le simulateur mobile)
- Version (2026, 2025…)
- Actif (toggle on/off)

Filtres en haut :
- Par version (2026 par défaut)
- Par catégorie
- Par périodicité
- Par état (actif / archivé)
- Champ recherche libre (code + libellé)

Actions par ligne : Modifier, Dupliquer, Désactiver.
Action globale : Nouvelle obligation, Importer depuis l'année précédente.

### Page 2 — Formulaire création / édition
URL : `/admin/obligations/new` ou `/admin/obligations/:id`

Formulaire en sections collapsibles :

#### 2.1 Identité
- Code (input, contrainte unique par version) — ex. ITS, TVA, IS, MP
- Libellé (input)
- Description (textarea, optionnel)
- Catégorie (select, valeurs depuis enum `AlerteCategorie`)
- Version (select : année fiscale 2025, 2026, 2027…)

#### 2.2 Échéance
- Périodicité (radio : mensuelle, bimensuelle, trimestrielle, semestrielle,
  annuelle, ponctuelle)
- Selon la périodicité choisie, le formulaire affiche les bons champs :
  - Mensuelle : « Jour du mois » (1-31 ou « dernier jour »)
  - Trimestrielle : mois concernés (multiselect : 3, 6, 9, 12 par exemple)
    + jour
  - Annuelle : mois (1-12) + jour
  - Ponctuelle : règle libre (texte décrivant le déclencheur)
- Aperçu des 3 prochaines échéances calculées à partir des règles saisies
  (helper visuel pour valider).

#### 2.3 Applicabilité
Constructeur de règles avec ajout/suppression de critères. Chaque critère :
- Champ (select : `salaries_count`, `regime_tva`, `regime_is`,
  `possede_foncier_bati`, `possede_foncier_non_bati`, `secteur_activite`,
  `ca_n_moins_1`, `forme_juridique`…)
- Opérateur (select : égal, ≥, ≤, parmi, exclu de, est vrai, est faux)
- Valeur (input adapté au champ : nombre, liste, booléen)

Aperçu JSON en lecture seule à droite, qui correspond à ce qui sera stocké
dans `applicabilite`. Si vide, l'obligation s'applique à toutes les
entités.

Exemple de règles que le fiscaliste construit cliquablement :
- ITS → `salaries_count >= 1`
- TVA réel → `regime_tva = "reel"`
- CFPB → `possede_foncier_bati = true`
- Taxe HCR → `secteur_activite parmi ["HCR"]`
- MP → s'applique à toutes les entités assujetties à l'IS, donc
  `regime_is parmi ["reel_normal", "reel_simplifie"]`

#### 2.4 Référence légale
- Article CGI : autocomplete connecté à la table `articles` existante.
  Quand l'admin tape « 277 », le système propose « Art. 277 — Patente,
  Champ d'application ». Sélection → `articleId` rempli automatiquement.
- Numéro affiché en clair (`articleNumero`) pour ne pas casser si
  l'article est mis à jour.

#### 2.5 Calcul
- Simulateur lié (select parmi les 16 simulateurs déjà en place :
  patente, is, its, tva, ircm, iba, igf, irf-loyers,
  contribution-fonciere, taxe-immobiliere, cession-parts, enregistrement,
  solde-liquidation, retenue-source, paie, is-parapetrolier).
- Indique au système quel simulateur ouvrir quand l'utilisateur clique
  « Calculer » sur un dossier de cette obligation.

#### 2.6 Présentation
- Ordre d'affichage (number, défaut 100) — permet de regrouper les
  obligations dans le calendrier (les déclarations mensuelles avant les
  annuelles, par exemple).
- Actif (toggle) — désactive sans supprimer (audit trail conservé).

Boutons en bas :
- Annuler (retour liste)
- Enregistrer (validation + redirection liste)
- Enregistrer et nouvelle (saisie en chaîne pour la première version
  qui charge tout le catalogue)

### Page 3 — Aperçu / test d'une obligation
URL : `/admin/obligations/:id/preview`

Permet à l'admin de simuler l'application de la règle sur des profils
fictifs ou réels :
- Sélectionne une entité existante (ou crée un profil fictif inline) avec
  ses caractéristiques (régime, salariés, foncier, secteur, CA…)
- Affiche : « cette obligation s'applique-t-elle ? oui/non »
- Affiche les 12 prochaines échéances calculées
- Utile pour valider que la règle d'applicabilité est correcte avant
  d'activer.

### Page 4 — Versionning par année fiscale
URL : `/admin/obligations/versions`

- Liste des versions de catalogue (2025, 2026, 2027 prévue…)
- Bouton « Ouvrir la version 2027 à partir de 2026 » → duplique tout le
  catalogue actif vers une nouvelle version, le fiscaliste amende les
  obligations qui changent (taux IS, plafonds, dates, nouvelles taxes).
- Bascule de version active : à un instant T une seule version est en
  cours pour la génération des dossiers.

---

## Sécurité et permissions

- Accès réservé aux comptes avec rôle `SUPER_ADMIN` ou `FISCALISTE_ADMIN`
  (rôle nouveau à ajouter dans `UserRole`).
- Toutes les modifications loggées dans la table `audit_log` existante :
  qui a modifié quoi quand.
- Aucune suppression dure : `actif=false` pour archiver, jamais de DELETE.

---

## Effort d'implémentation

- Routes API CRUD obligations (Express) : 0,5 jour
- Page liste avec filtres (mobile + web) : 1 jour
- Formulaire création/édition complet : 2 jours
  - dont constructeur de règles d'applicabilité : 1 jour
- Page aperçu / test : 0,5 jour
- Versionning : 0,5 jour
- Permissions et audit : 0,5 jour

Total : **~5 jours** de dev en plus des 5,5 j déjà prévus pour le Bloc 1.1.

Cet effort en vaut la peine si on imagine plusieurs années d'évolution
législative et plusieurs marchés (Congo, possible extension Cameroun
Cameroun ou Sénégal plus tard avec leur propre catalogue).

---

## Alternative pour la première version

Si on veut éviter les 5 jours d'UI dès le démarrage :

1. Phase 0 (1 jour) : un fiscaliste donne le catalogue dans un Google
   Sheet (1 ligne par obligation, 8 colonnes : code, libellé, catégorie,
   périodicité, jour échéance, mois échéance, règle applicabilité,
   article CGI). Un script TypeScript le lit et l'insère en SQL.
2. Phase 1 (plus tard, quand on a les autres blocs) : on bâtit l'UI
   admin pour faciliter la maintenance annuelle.

Cette voie permet de commencer Bloc 2 (génération du calendrier) sans
attendre l'UI. Inconvénient : les corrections/mises à jour passent
forcément par un dev tant que l'UI n'existe pas.
