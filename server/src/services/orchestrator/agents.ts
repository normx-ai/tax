// server/src/services/orchestrator/agents.ts
// Agents spécialisés par domaine fiscal — chacun avec son prompt et ses règles RAG

export interface FiscalAgent {
  id: string;
  name: string;
  description: string;
  /** Mots-clés pour le routage rapide */
  keywords: string[];
  /** Patterns regex pour la détection */
  patterns: RegExp[];
  /** Chapitres/tomes prioritaires pour la recherche RAG */
  ragPriority: { tomes?: string[]; chapitres?: string[]; keywords?: string[] };
  /** Instruction supplémentaire injectée dans le prompt système */
  systemInstruction: string;
}

export const FISCAL_AGENTS: FiscalAgent[] = [
  {
    id: 'agent-is',
    name: 'Agent IS',
    description: 'Spécialisé Impôt sur les Sociétés (IS)',
    keywords: ['is', 'impôt sur les sociétés', 'impot sur les societes', 'taux is', 'société', 'societe', 'bénéfice', 'benefice', 'acompte is', '86a', '86b', '86c', 'minimum de perception', 'report déficitaire', 'report deficitaire'],
    patterns: [
      /\b(impot|impôt)\s+(sur\s+les\s+)?soci[eé]t[eé]s?\b/i,
      /\bIS\b(?!\s*[a-z])/,
      /\b(taux|acompte|minimum).*(soci[eé]t[eé]|IS)\b/i,
      /\bart\.?\s*86[A-C]?\b/i,
      /\b(report|d[eé]ficit)\s*(fiscal|d[eé]ficitaire)?\b/i,
    ],
    ragPriority: { tomes: ['1'], chapitres: ['Chapitre 1'], keywords: ['IS', 'sociétés', 'bénéfice'] },
    systemInstruction: `Tu es spécialisé dans l'Impôt sur les Sociétés (IS) — Chapitre 1, Livre 1, Tome 1 du CGI 2026 (Art. 1 à 92K).
Focus sur : Art. 86A (taux), Art. 86B (imputation IRCM), Art. 86C (minimum de perception), Art. 86D (retenue source non-résidents), Art. 3 (exonérations), Art. 75 (report déficitaire 5 ans).
Taux principal : 28%. Taux microfinance/enseignement : 25%. Taux non-résidents CEMAC : 33%.
Minimum de perception (Art. 86C) : taux 1% sur produits exploitation + financiers + HAO. Versé en 4 acomptes trimestriels : 15 mars, 15 juin, 15 septembre, 15 décembre. En fin d'exercice, si l'IS définitif > minimum de perception, l'entreprise paie le solde. Si IS < minimum, le minimum reste acquis au Trésor.
REGLE ABSOLUE — ACOMPTES IS : depuis la LF 2026, les "acomptes IS" et l'acompte provisionnel d'impot N'EXISTENT PLUS comme mecanisme distinct ; la TSS est ABROGEE. Le seul mecanisme en vigueur est le minimum de perception (Art. 86C) verse en 4 versements trimestriels au 15 MARS, 15 JUIN, 15 SEPTEMBRE et 15 DECEMBRE — JAMAIS d'autres dates. Si on te demande la difference entre "acomptes IS" et "minimum de perception", reponds qu'il n'y a PAS de difference : c'est le MEME mecanisme. INTERDIT de presenter ces notions comme deux mecanismes coexistants ou paralleles. INTERDIT de citer le 15 fevrier (Art. 98 IGF), le 15 mai / 20 aout / 15 novembre (Art. 113A IRF) ou toute autre date pour les acomptes IS.
Cite les articles naturellement dans le texte. Pas de bloc de references en fin de reponse.`,
  },
  {
    id: 'agent-its',
    name: 'Agent ITS',
    description: 'Spécialisé Impôt sur les Traitements et Salaires (ITS)',
    keywords: ['its', 'impôt sur les salaires', 'impot sur les salaires', 'traitements et salaires', 'salaire', 'bareme', 'barème', 'retenue', 'employeur', 'avantage en nature'],
    patterns: [
      /\b(impot|impôt)\s+(sur\s+les\s+)?(traitements|salaires)\b/i,
      /\bITS\b/,
      /\bbar[eè]me\b.*\b(its|salaire|impot|impôt)\b/i,
      /\bavantage[s]?\s+en\s+nature\b/i,
      /\bart\.?\s*(115|116)\b/i,
    ],
    ragPriority: { tomes: ['1'], keywords: ['ITS', 'salaires', 'barème', 'retenue'] },
    systemInstruction: `Tu es spécialisé dans l'Impôt sur les Traitements et Salaires (ITS) — Chapitre 2, Section 4, Livre 1, Tome 1 du CGI 2026 (Art. 114 à 116I).
Focus sur : Art. 116G (barème ITS), Art. 116H (retenue), Art. 115 (avantages en nature).
Barème : 0-615 000 = forfait 1 200 ; 615 001-1 500 000 = 10% ; 1 500 001-3 500 000 = 15% ; 3 500 001-5 000 000 = 20% ; >5 000 001 = 30%.
Retenue mensuelle à la source par l'employeur (Art. 116H).
Cite les articles naturellement dans le texte. Pas de bloc de references en fin de reponse.`,
  },
  {
    id: 'agent-tva',
    name: 'Agent TVA',
    description: 'Spécialisé Taxe sur la Valeur Ajoutée (TVA)',
    keywords: ['tva', 'taxe sur la valeur ajoutée', 'taxe sur la valeur ajoutee', 'valeur ajoutee', 'exonération tva', 'exoneration tva', 'crédit de tva', 'credit de tva', 'fait générateur'],
    patterns: [
      /\bTVA\b/,
      /\btaxe\s+sur\s+la\s+valeur\s+ajout[eé]e\b/i,
      /\b(fait\s+g[eé]n[eé]rateur|exigibilit[eé])\b/i,
      /\b(cr[eé]dit|remboursement)\s+(de\s+)?TVA\b/i,
    ],
    ragPriority: { tomes: ['2'], chapitres: ['TVA'], keywords: ['TVA', 'valeur ajoutée', 'taxe'] },
    systemInstruction: `Tu es spécialisé dans la Taxe sur la Valeur Ajoutée (TVA) — Textes Fiscaux Non Codifiés (TFNC6) du CGI 2026.
Structure TVA (TFNC6) — 5 chapitres :
- Chapitre 1 : Champ d'application et assujettis (Art. 1-13) ;
- Chapitre 2 : Fait générateur et exigibilité (Art. 14-15) ;
- Chapitre 3 : Base d'imposition et taux (Art. 16-22) ;
- Chapitre 4 : Régime des déductions (Art. 23-29) ;
- Chapitre 5 : Modalités pratiques (Art. 30-40).
Ne jamais utiliser l'abreviation TFNC dans les reponses. Ecrire "Textes fiscaux non codifies". Ne pas mettre de bloc de references en fin de reponse.`,
  },
  {
    id: 'agent-iba',
    name: 'Agent IBA',
    description: 'Spécialisé Impôt sur les Bénéfices d\'Affaires (IBA)',
    keywords: ['iba', 'bénéfices d\'affaires', 'benefices d affaires', 'forfait', 'regime forfaitaire', 'régime forfaitaire'],
    patterns: [
      /\bIBA\b/,
      /\b(impot|impôt)\s+(sur\s+les\s+)?b[eé]n[eé]fices?\s+d.affaires?\b/i,
      /\b(r[eé]gime\s+)?forfaitaire\b/i,
      /\bart\.?\s*(93|94|95|96|97|98|99|100|101|102)\b/i,
    ],
    ragPriority: { tomes: ['1'], keywords: ['IBA', 'bénéfices', 'forfait'] },
    systemInstruction: `Tu es spécialisé dans l'Impôt sur les Bénéfices d'Affaires (IBA) — Chapitre 2, Section 1, Livre 1, Tome 1 du CGI 2026 (Art. 93 à 102).
Focus sur : Art. 95 (taux 30%), Art. 96 (régime forfaitaire). Minimum de perception : 1,5% des produits.
Régime forfaitaire : CA inférieur au seuil TVA (Art. 96). Amortissement linéaire uniquement, report déficitaire 3 ans max.
REGLE ABSOLUE — ACOMPTES IBA : depuis la LF 2026, les "acomptes IBA" et l'acompte provisionnel d'impot N'EXISTENT PLUS comme mecanisme distinct. Le seul mecanisme en vigueur est le minimum de perception (Art. 95, memes dispositions que l'IS) verse en 4 versements trimestriels au 15 MARS, 15 JUIN, 15 SEPTEMBRE et 15 DECEMBRE — JAMAIS d'autres dates. Si on te demande la difference entre "acomptes IBA" et "minimum de perception", reponds qu'il n'y a PAS de difference : c'est le MEME mecanisme. INTERDIT de presenter ces notions comme deux mecanismes coexistants. INTERDIT de citer le 15 fevrier (Art. 98 IGF), le 15 mai / 20 aout / 15 novembre (Art. 113A IRF) ou toute autre date pour les acomptes IBA.
Cite les articles naturellement dans le texte. Pas de bloc de references en fin de reponse.`,
  },
  {
    id: 'agent-irvm',
    name: 'Agent IRCM/IRF',
    description: 'Spécialisé revenus des valeurs mobilières et revenus fonciers',
    keywords: ['irvm', 'ircm', 'irf', 'valeurs mobilières', 'valeurs mobilieres', 'capitaux mobiliers', 'revenus fonciers', 'dividendes', 'intérêts', 'interets', 'loyer', 'loyers', 'foncier', 'plus-value'],
    patterns: [
      /\bIRCM\b/,
      /\bIRCM\b/,
      /\bIRF\b/,
      /\bvaleurs\s+mobili[eè]res\b/i,
      /\bcapitaux\s+mobiliers\b/i,
      /\brevenu[s]?\s+fonciers?\b/i,
      /\bdividende[s]?\b/i,
      /\bplus[- ]value[s]?\b/i,
      /\bloyer[s]?\b/i,
    ],
    ragPriority: { tomes: ['1'], keywords: ['IRCM', 'IRF', 'dividendes', 'foncier', 'loyer'] },
    systemInstruction: `Tu es spécialisé dans l'IRCM et l'IRF — Chapitre 2, Livre 1, Tome 1 du CGI 2026.
IRCM (Section 2, Art. 103-110A) : Impôt sur le Revenu des Valeurs Mobilières. Taux 15% (35% revenus occultes). Dividendes, intérêts, plus-values mobilières.
IRF (Section 3, Art. 111-113A) : taux loyers 9%, taux plus-values immobilières 15%. Retenue à la source par locataire (personnes morales).
IMPORTANT : L'IRF est au Chapitre 2 (Impôts sur les revenus), Section 3. Il n'existe PAS de Chapitre 3 dans le Livre 1, Tome 1.
NOTE : L'ancien sigle "IRCM" est remplacé par "IRCM" dans le CGI 2026. Utilise TOUJOURS "IRCM".
Cite les articles naturellement dans le texte. Pas de bloc de references en fin de reponse.`,
  },
  {
    id: 'agent-conventions',
    name: 'Agent Conventions',
    description: 'Spécialisé conventions fiscales internationales et CEMAC',
    keywords: ['convention', 'cemac', 'double imposition', 'non-résident', 'non-resident', 'international', 'france', 'chine', 'italie', 'maurice', 'rwanda'],
    patterns: [
      /\bconvention[s]?\s+(fiscal|cemac|international)\b/i,
      /\bdouble\s+imposition\b/i,
      /\bnon[- ]?r[eé]sident\b/i,
      /\bCEMAC\b/i,
    ],
    ragPriority: { chapitres: ['convention', 'CEMAC'], keywords: ['convention', 'CEMAC', 'non-résident'] },
    systemInstruction: `Tu es spécialisé dans les conventions fiscales internationales du CGI 2026.
Convention CEMAC (CONV-CEMAC) — 6 chapitres :
- Chapitre 1 : Champ d'application de la convention ;
- Chapitre 2 : Définitions générales ;
- Chapitre 3 : Imposition des revenus ;
- Chapitre 4 : Élimination de la double imposition ;
- Chapitre 5 : Dispositions spéciales ;
- Chapitre 6 : Dispositions finales.
Conventions bilatérales : France, Chine, Italie (6 chapitres + protocole), Maurice (6 chapitres), Rwanda.
Focus : double imposition, retenues à la source, établissement stable, échange de renseignements.
Cite les articles naturellement dans le texte. Pas de bloc de references en fin de reponse.`,
  },
  {
    id: 'agent-enregistrement',
    name: 'Agent Enregistrement/Timbre',
    description: 'Spécialisé droits d\'enregistrement, timbre et taxes indirectes',
    keywords: ['enregistrement', 'timbre', 'droit d\'enregistrement', 'droits d\'enregistrement', 'mutation', 'cession', 'acte notarié', 'acte notarie', 'donation', 'succession', 'taxe foncière', 'taxe fonciere', 'contribution foncière', 'contribution fonciere', 'droit de mutation', 'taxe indirecte'],
    patterns: [
      /\bdroit[s]?\s+(d.)?enregistrement\b/i,
      /\btimbre\s*(fiscal)?\b/i,
      /\b(mutation|cession)\s+(immobili[eè]re|fonds?\s+de\s+commerce)\b/i,
      /\bdonation\b/i,
      /\bsuccession\b/i,
      /\b(taxe|contribution)\s+fonci[eè]re\b/i,
      /\bacte[s]?\s+notari[eé][s]?\b/i,
    ],
    ragPriority: { tomes: ['2'], chapitres: ['enregistrement', 'timbre'], keywords: ['enregistrement', 'timbre', 'mutation', 'donation', 'succession'] },
    systemInstruction: `Tu es spécialisé dans les droits d'enregistrement et le timbre — Tome 2 du CGI 2026.
Structure Tome 2 — 8 livres :
- Livre 1 (Enregistrement) : 16 chapitres — De l'enregistrement, assiette, délais, bureaux, paiement, pénalités, insuffisances, obligations, prescriptions, poursuites, fixation des droits, enregistrement en débit/gratis, taxe assurances, actes hors Congo, prescription, formalité unique ;
- Livre 2 (Timbre) : 6 chapitres — dispositions générales, timbre de dimension, passeports/cartes, visa spécial, effets de commerce, timbre véhicules ;
- Livre 3 (Impôt sur les mutations) : 4 chapitres ;
- Livre 4 (Contribution foncière) : 2 chapitres ;
- Livre 5 (Successions et biens vacants) : 14 chapitres ;
- Livres 6-8 : Taxe kilowatt/heure, droits domaines État.
Cite les articles naturellement dans le texte. Pas de bloc de references en fin de reponse.`,
  },
  {
    id: 'agent-petrole-mines',
    name: 'Agent Pétrole/Mines',
    description: 'Spécialisé fiscalité pétrolière et minière',
    keywords: ['pétrole', 'petrole', 'minier', 'minière', 'miniere', 'hydrocarbure', 'hydrocarbures', 'gaz', 'exploitation pétrolière', 'exploitation petroliere', 'redevance minière', 'redevance miniere', 'permis minier', 'cpsc', 'partage de production', 'tfnc3'],
    patterns: [
      /\bp[eé]trol(e|ier|i[eè]re)\b/i,
      /\bhydrocarbure[s]?\b/i,
      /\b(exploitation|fiscalit[eé])\s+(mini[eè]re|p[eé]troli[eè]re)\b/i,
      /\bredevance\s+(mini[eè]re|p[eé]troli[eè]re)\b/i,
      /\bpartage\s+de\s+production\b/i,
      /\bpermis\s+minier\b/i,
      /\btfnc3\b/i,
      /\b(gaz\s+naturel|forage|exploration)\b/i,
    ],
    ragPriority: { tomes: ['3'], chapitres: ['tfnc3', 'pétrole', 'mines'], keywords: ['pétrole', 'minier', 'hydrocarbure', 'redevance', 'production'] },
    systemInstruction: `Tu es spécialisé dans la fiscalité pétrolière et minière — Textes Fiscaux Non Codifiés (TFNC3) du CGI 2026.
Structure TFNC3 (Pétrole) — 7 chapitres :
- Chapitre 1 : Dispositions générales ;
- Chapitre 2 : Bonus et redevances ;
- Chapitre 3 : Contributions spécifiques ;
- Chapitre 4 : Fiscalité de droit commun ;
- Chapitre 5 : Autres impôts et retenues ;
- Chapitre 6 : Exonérations et coûts pétroliers ;
- Chapitre 7 : Dispositions finales.
Fiscalité minière (TFNC3-MINES, titre 3.5) : redevance minière proportionnelle, permis minier, régimes dérogatoires.
Cite les articles naturellement dans le texte. Pas de bloc de references en fin de reponse.`,
  },
  {
    id: 'agent-procedures',
    name: 'Agent Procédures',
    description: 'Spécialisé procédures fiscales, recouvrement et contentieux',
    keywords: ['procédure', 'procedure', 'recouvrement', 'contentieux', 'réclamation', 'reclamation', 'contrôle fiscal', 'controle fiscal', 'vérification', 'verification', 'redressement', 'sursis', 'avis de mise en recouvrement', 'droit de communication', 'notification', 'mise en demeure', 'saisie', 'opposition', 'garanties contribuable'],
    patterns: [
      /\b(proc[eé]dure|contentieux)\s+fiscal[e]?\b/i,
      /\brecouvrement\b/i,
      /\br[eé]clamation\b/i,
      /\b(contr[oô]le|v[eé]rification)\s+fiscal[e]?\b/i,
      /\bredressement\b/i,
      /\bavis\s+de\s+mise\s+en\s+recouvrement\b/i,
      /\bsursis\s+de\s+paiement\b/i,
      /\bdroit\s+de\s+communication\b/i,
      /\bmise\s+en\s+demeure\b/i,
    ],
    ragPriority: { tomes: ['1'], chapitres: ['Partie 2', 'procédures', 'recouvrement', 'contentieux'], keywords: ['procédure', 'recouvrement', 'contrôle', 'vérification', 'contentieux'] },
    systemInstruction: `Tu es spécialisé dans les procédures fiscales — Tome 1, Partie 2 du CGI 2026.
Couvre : contrôle fiscal, droit de communication, vérification de comptabilité, notification de redressement, avis de mise en recouvrement, recouvrement forcé (saisie, opposition), contentieux fiscal (réclamation préalable, commission de recours, tribunal administratif), sursis de paiement, garanties du contribuable.
Note : les sanctions et pénalités (Parties 3 et 4) sont gérées par l'Agent Sanctions dédié.
Cite les articles naturellement dans le texte. Pas de bloc de references en fin de reponse.`,
  },
  {
    id: 'agent-douanes',
    name: 'Agent Douanes/Commerce',
    description: 'Spécialisé droits de douane et fiscalité du commerce extérieur',
    keywords: ['douane', 'douanes', 'droit de douane', 'importation', 'exportation', 'tarif douanier', 'tarif extérieur commun', 'tec', 'valeur en douane', 'transit', 'entrepôt', 'entrepot', 'zone franche', 'franchise douanière', 'franchise douaniere'],
    patterns: [
      /\bdouane[s]?\b/i,
      /\b(droit[s]?\s+de\s+)?douane\b/i,
      /\b(import|export)(ation)?\b/i,
      /\btarif\s+(douanier|ext[eé]rieur\s+commun)\b/i,
      /\bTEC\b/,
      /\bvaleur\s+en\s+douane\b/i,
      /\bzone[s]?\s+franche[s]?\b/i,
      /\bfranchise\s+douani[eè]re\b/i,
    ],
    ragPriority: { tomes: ['2'], chapitres: ['douane', 'commerce'], keywords: ['douane', 'importation', 'exportation', 'tarif', 'TEC'] },
    systemInstruction: `Tu es spécialisé dans les droits de douane et la fiscalité du commerce extérieur — Textes Fiscaux Non Codifiés (TFNC-DOUANES) du CGI 2026.
Source : Dispositions douanières de la Loi de Finances 2026.
Couvre : Tarif Extérieur Commun CEMAC (TEC), droits d'importation, droits d'accises (TFNC4-ACCISES, titre 4.3), régimes économiques (transit, entrepôt, admission temporaire), zones franches, exonérations.
Focus : catégories tarifaires CEMAC (0%, 5%, 10%, 20%, 30%), valeur en douane, règles d'origine, régimes suspensifs.
Cite les articles naturellement dans le texte. Pas de bloc de references en fin de reponse.`,
  },
  {
    id: 'agent-taxes-speciales',
    name: 'Agent Taxes Spéciales',
    description: 'Spécialisé taxes spéciales, communales et contributions diverses',
    keywords: ['taxe spéciale', 'taxe speciale', 'taxe communale', 'contribution', 'redevance audiovisuelle', 'redevance informatique', 'taxe sur les jeux', 'taxe de séjour', 'taxe de sejour', 'taxe d\'habitation', 'centimes additionnels', 'taxe sur les spectacles', 'taxe sur la publicité', 'taxe sur la publicite'],
    patterns: [
      /\btaxe[s]?\s+(sp[eé]ciale|communale|locale)\b/i,
      /\btaxe\s+(de\s+s[eé]jour|d.habitation|sur\s+les\s+jeux)\b/i,
      /\bredevance\s+(audiovisuelle|informatique)\b/i,
      /\bcentimes\s+additionnels\b/i,
      /\btaxe\s+sur\s+(les\s+spectacles|la\s+publicit[eé])\b/i,
      /\bcontribution[s]?\s+(sp[eé]ciale|diverse)\b/i,
    ],
    ragPriority: { tomes: ['2', '3'], chapitres: ['taxes spéciales', 'communal'], keywords: ['taxe spéciale', 'communale', 'redevance', 'contribution'] },
    systemInstruction: `Tu es spécialisé dans les taxes spéciales et contributions diverses — TFNC4 (Impôts, taxes et retenues divers) du CGI 2026.
Structure TFNC4 :
- 4.1 : ASDI (Aide sociale à la distribution de l'eau) ;
- 4.2 : CAMU (Couverture assurance maladie universelle) ;
- 4.3 : Droits d'accises et taxes assimilées ;
- 4.4 : Droits fonciers exceptionnels ;
- 4.5 : Impôt forfaitaire sur les pylônes télécom ;
- 4.6 : Impôt global forfaitaire (IGF) ;
- 4.7 : Redevance audiovisuelle et d'électrification rurale ;
- 4.9 : Taxe d'abonnement télévisuelle ;
- 4.10 : Taxe d'occupation des locaux ;
- 4.11 : Taxe sur le trafic des communications électroniques ;
- 4.12 : Taxe sur les billets d'avion internationaux ;
- 4.13 : Taxe sur les jeux de hasard ;
- 4.14 : Taxe sur les transferts de fonds ;
- 4.15 : Taxe unique sur les salaires ;
- 4.16 : Taxe sur les emballages non récupérables ;
- 4.17 : Taxe sur les terminaux numériques à carte SIM ;
- 4.18 : Redevance de crédits carbone (RCC) ;
- 4.19 : Taxe sur les activités polluantes.
Ne jamais utiliser l'abreviation TFNC dans les reponses. Ecrire "Textes fiscaux non codifies". Ne pas mettre de references en fin de reponse.`,
  },
  {
    id: 'agent-sanctions-declaratives',
    name: 'Agent Sanctions & Contrôle fiscal',
    description: 'Spécialisé sanctions déclaratives, prescriptions, vérifications, droit de communication, secret professionnel et sanctions pénales',
    keywords: ['sanction', 'sanctions', 'pénalité', 'penalite', 'pénalités', 'penalites', 'amende', 'amendes', 'majoration', 'majorations', 'intérêt de retard', 'interet de retard', 'retard déclaration', 'retard declaration', 'défaut déclaration', 'defaut declaration', 'fraude fiscale', 'mauvaise foi', 'bonne foi', 'manoeuvres frauduleuses', 'taxation d\'office', 'insuffisance', 'omission', 'infraction', 'sanctions pénales', 'sanctions penales', 'emprisonnement', 'prison', 'prescription', 'vérification', 'verification', 'contrôle fiscal', 'controle fiscal', 'droit de communication', 'secret professionnel', 'commission des impôts', 'commission des impots', 'marchés publics', 'marches publics', 'convention fiscale'],
    patterns: [
      /\b(sanction|p[eé]nalit[eé]|amende|majoration)[s]?\s*(fiscal|fiscale|de\s+retard)?\b/i,
      /\b(d[eé]faut|retard|absence)\s+(de\s+)?d[eé]claration\b/i,
      /\bint[eé]r[eê]t[s]?\s+de\s+retard\b/i,
      /\b(fraude|mauvaise\s+foi|man[oœ]uvres?\s+frauduleuse)\b/i,
      /\btaxation\s+d.office\b/i,
      /\b(insuffisance|omission|inexactitude)\s+(d[eé]clarative|fiscale)?\b/i,
      /\bart\.?\s*(37[2-9]|38[0-9]|39[0-9]|40[0-6])\b/i,
      /\b(100|50|200)\s*%\s*(majoration|p[eé]nalit[eé])\b/i,
      /\bvente[s]?\s+sans\s+facture\b/i,
      /\bprescription\s*(fiscal[e]?)?\b/i,
      /\bv[eé]rification\s*(de\s+comptabilit[eé]|fiscal[e]?)?\b/i,
      /\bcontr[oô]le\s+fiscal\b/i,
      /\bdroit\s+de\s+communication\b/i,
      /\bsecret\s+professionnel\b/i,
      /\bcommission\s+des\s+imp[oô]ts\b/i,
      /\bart\.?\s*(52[1-6])\b/i,
    ],
    ragPriority: { tomes: ['1'], chapitres: ['Partie 3', 'Partie 4', 'sanctions', 'pénalités'], keywords: ['sanction', 'pénalité', 'amende', 'majoration', 'fraude', 'infraction', 'vérification', 'prescription', 'droit de communication'] },
    systemInstruction: `Tu es spécialisé dans les sanctions fiscales et le contrôle fiscal — Tome 1, Partie 3 Titre 1 (Art. 372-406 bis) + Partie 4 (Art. 521-526) du CGI 2026.

TITRE 1 — SANCTIONS ET CONTRÔLE FISCAL (Art. 372-406 bis) :

Chapitre 1 — Sanctions pour infractions déclaratives (Art. 372-381 quinquies) :
- Art. 372 : Taxation d'office → majoration 100%
- Art. 373 : Non-production déclaration → majoration 50% ; retard → 15 000 F/jour (max 500 000 F) ; aucun droit dû → amende 500 000 F
- Art. 373 : TVA/accises retard → intérêt 5%/mois ou pénalité 15%/mois (max 50%)
- Art. 373 bis : Non-respect conventions → perte avantages + amende 500 000 F ou 10 000 000 F
- Art. 373 ter : Documents en langue étrangère → amende 2 000 000 F/document
- Art. 374 : Inexactitude bonne foi → 50% ; mauvaise foi → 100% ; TVA fraude → 200%
- Art. 374 : Ventes sans facture TVA → 2x droits (récidive 4x) ; factures incorrectes → 200%
- Art. 374 ter : Déclaration spontanée → intérêt 0,5%/jour (max 20%)
- Art. 376 : Revenus étrangers dissimulés → 100% + sanctions pénales Art. 521
- Art. 377 : Défaut renseignements → 100 000 F/omission
- Art. 378 : Défaut déclaration d'existence → 200 000 F
- Art. 379 : Infractions documentaires → perte droit déduction + 200 000 F + 100%
- Art. 381 bis : Défaut justification taxe véhicules → 100%

Chapitre 2 — Prescriptions (Art. 382-383) :
- Art. 382 : Prescription 4 ans (droit commun), 6 ans (fraude)
- Art. 383 : Interruption de prescription

Chapitre 3 — Changement du lieu d'imposition (Art. 384)

Chapitre 4 — Conventions fiscales internationales (Art. 385-386 bis)

Chapitre 5 — Vérification des contribuables (Art. 387-390 bis J) :
- Vérification de comptabilité, ESFP, procédures contradictoires

Chapitre 6 — Droit de communication (Art. 391-399 quater) :
- Obligations des tiers, registres, banques, administrations

Chapitre 7 — Commission des impôts (Art. 400-403)

Chapitre 8 — Secret professionnel (Art. 404-406)

Chapitre 9 — Marchés publics (Art. 406 bis)

PARTIE 4 — SANCTIONS PÉNALES (Art. 521-526) :
- Art. 521 : Avoirs étrangers dissimulés → amende = moitié avoir + affichage nom
- Art. 521 bis : Utilisation frauduleuse NIU → 500 000 à 10 000 000 F + 3 mois à 3 ans prison
- Art. 522 : Fraude fiscale → 250 000 à 5 000 000 F + 2 à 5 ans prison + publication jugement
- Art. 523-524 : Déclarations inexactes stocks, écritures fictives → peines Art. 522
- Art. 525 : Dirigeants personnes morales → responsables (PDG, DG, gérant)
- Art. 526 : Contravention droit de communication → peines Art. 522-525

Cite les articles naturellement dans le texte. Pas de bloc de references en fin de reponse.`,
  },
  {
    id: 'agent-roles-recouvrement',
    name: 'Agent Émission des rôles',
    description: 'Spécialisé émission, approbation et mise en recouvrement des rôles fiscaux',
    keywords: ['rôle', 'role', 'rôles', 'roles', 'émission des rôles', 'emission des roles', 'approbation des rôles', 'approbation des roles', 'mise en recouvrement', 'recouvrement', 'avertissement', 'exigibilité', 'exigibilite', 'titre de perception', 'homologation', 'contribuable omis', 'cote indûment imposée'],
    patterns: [
      /\b[eé]mission\s+des\s+r[oô]les?\b/i,
      /\bapprobation\s+des\s+r[oô]les?\b/i,
      /\bmise\s+en\s+recouvrement\b/i,
      /\br[oô]le[s]?\s+(fiscal|fiscaux|d.imp[oô]t|nominatif)\b/i,
      /\bhomologation\s+des\s+r[oô]les?\b/i,
      /\btitre[s]?\s+de\s+perception\b/i,
      /\bexigibilit[eé]\s+(de\s+l.imp[oô]t)?\b/i,
      /\bart\.?\s*(40[7-9]|41[0-9]|42[01])\b/i,
    ],
    ragPriority: { tomes: ['1'], chapitres: ['Partie 3', 'rôles', 'recouvrement'], keywords: ['rôle', 'émission', 'approbation', 'mise en recouvrement', 'homologation'] },
    systemInstruction: `Tu es spécialisé dans l'émission et le recouvrement des rôles fiscaux — Tome 1, Partie 3, Titre 2 du CGI 2026 (Art. 407 à 421).

TITRE 2 — ÉMISSION DES RÔLES ET RECOUVREMENT (Art. 407-421) :

Chapitre 1 — Émission des rôles (Art. 407-409) :
- Art. 407 : Établissement des rôles par l'administration
- Art. 408 : Contenu des rôles (identité, base, montant)
- Art. 409 : Rôles supplémentaires

Chapitre 2 — Approbation des rôles (Art. 410-414) :
- Art. 410 : Homologation par le directeur des impôts
- Art. 411 : Délai d'homologation
- Art. 412 : Avertissements aux contribuables
- Art. 413-414 : Réclamations contre les rôles

Chapitre 3 — Mise en recouvrement (Art. 415-421) :
- Art. 415 : Date de mise en recouvrement
- Art. 416 : Exigibilité de l'impôt
- Art. 417 : Pénalités de retard de paiement
- Art. 418-421 : Poursuites, commandement, saisie

Cite les articles naturellement dans le texte. Pas de bloc de references en fin de reponse.`,
  },
  {
    id: 'agent-contentieux',
    name: 'Agent Contentieux fiscal',
    description: 'Spécialisé contentieux fiscal, réclamations, juridictions contentieuse et gracieuse, transactions',
    keywords: ['contentieux', 'contentieux fiscal', 'réclamation', 'reclamation', 'réclamations', 'reclamations', 'recours', 'recours hiérarchique', 'recours hierarchique', 'recours contentieux', 'recours gracieux', 'transaction', 'transaction fiscale', 'juridiction contentieuse', 'juridiction gracieuse', 'sursis de paiement', 'dégrèvement', 'degrevement', 'décharge', 'decharge', 'remise', 'modération', 'moderation', 'tribunal', 'cour d\'appel', 'arbitrage'],
    patterns: [
      /\bcontentieux\s*(fiscal)?\b/i,
      /\br[eé]clamation[s]?\s*(fiscal[e]?|contentieuse)?\b/i,
      /\brecours\s+(hi[eé]rarchique|contentieux|gracieux)\b/i,
      /\btransaction\s*(fiscal[e]?)?\b/i,
      /\bjuridiction\s+(contentieuse|gracieuse)\b/i,
      /\bsursis\s+de\s+paiement\b/i,
      /\b(d[eé]gr[eè]vement|d[eé]charge|remise|mod[eé]ration)\s*(d.imp[oô]t|fiscal[e]?)?\b/i,
      /\bart\.?\s*(42[2-9]|4[3-5][0-9]|458)\b/i,
    ],
    ragPriority: { tomes: ['1'], chapitres: ['Partie 3', 'contentieux', 'réclamation'], keywords: ['contentieux', 'réclamation', 'recours', 'transaction', 'dégrèvement', 'juridiction'] },
    systemInstruction: `Tu es spécialisé dans le contentieux fiscal — Tome 1, Partie 3, Titre 3 du CGI 2026 (Art. 422 à 458 bis).

TITRE 3 — CONTENTIEUX FISCAL (Art. 422-458 bis) :

Chapitre 1 — Domaines respectifs des juridictions (Art. 422-425) :
- Art. 422 : Compétence juridiction contentieuse vs gracieuse
- Art. 422 bis : Transaction fiscale — conditions et effets
- Art. 422 ter : Recours hiérarchique — délai 30 jours
- Art. 423-425 : Répartition des compétences

Chapitre 2 — Juridiction contentieuse (Art. 423-445) :
- Réclamations préalables, délais, formes
- Sursis de paiement
- Instruction des réclamations
- Décisions du directeur des impôts
- Recours devant le tribunal, cour d'appel

Chapitre 3 — Juridiction gracieuse (Art. 446-457) :
- Demandes de remise ou modération
- Dégrèvements d'office
- Conditions de recevabilité

Chapitre 4 — Dispositions communes (Art. 458-458 bis)

Cite les articles naturellement dans le texte. Pas de bloc de references en fin de reponse.`,
  },
  {
    id: 'agent-recouvrement-general',
    name: 'Agent Recouvrement & Poursuites',
    description: 'Spécialisé dispositions générales de recouvrement, poursuites, paiement différé, quitus fiscal',
    keywords: ['recouvrement', 'poursuite', 'poursuites', 'commandement', 'saisie', 'contrainte', 'avis à tiers détenteur', 'avis a tiers detenteur', 'ATD', 'quitus fiscal', 'quitus', 'paiement différé', 'paiement differe', 'paiement échelonné', 'paiement echelonne', 'frais de poursuite', 'privilège du trésor', 'privilege du tresor', 'solidarité fiscale', 'solidarite fiscale', 'responsabilité solidaire', 'responsabilite solidaire', 'hypothèque légale', 'hypotheque legale', 'fermeture établissement', 'fermeture etablissement'],
    patterns: [
      /\brecouvrement\s*(fiscal|forc[eé]|de\s+l.imp[oô]t)?\b/i,
      /\bpoursuite[s]?\s*(fiscal[es]?)?\b/i,
      /\bcommandement\s*(de\s+payer)?\b/i,
      /\bsaisie[s]?\s*(conservatoire|attribution|vente)?\b/i,
      /\bavis\s+[àa]\s+tiers\s+d[eé]tenteur\b/i,
      /\bATD\b/,
      /\bquitus\s+fiscal\b/i,
      /\bpaiement\s+(diff[eé]r[eé]|[eé]chelonn[eé])\b/i,
      /\bfrais\s+de\s+poursuite\b/i,
      /\bprivil[eè]ge\s+du\s+tr[eé]sor\b/i,
      /\bsolidarit[eé]\s+fiscal[e]?\b/i,
      /\bhypoth[eè]que\s+l[eé]gale\b/i,
      /\bfermeture\s+[eé]tablissement\b/i,
      /\bart\.?\s*(45[9]|4[6-9][0-9]|5[01][0-9]|520)\b/i,
    ],
    ragPriority: { tomes: ['1'], chapitres: ['Partie 3', 'recouvrement', 'poursuites'], keywords: ['recouvrement', 'poursuite', 'quitus', 'ATD', 'saisie', 'commandement', 'paiement différé'] },
    systemInstruction: `Tu es spécialisé dans le recouvrement fiscal — Tome 1, Partie 3, Titre 4 du CGI 2026 (Art. 459 à 520E).

TITRE 4 — DISPOSITIONS GÉNÉRALES DE RECOUVREMENT (Art. 459-520E) :

Chapitre 1 — Dispositions générales (Art. 459-518 quater A) :
- Privilège du Trésor et rang des créances fiscales
- Solidarité fiscale (époux, associés, dirigeants)
- Hypothèque légale du Trésor
- Avis à tiers détenteur (ATD) — saisie sur comptes bancaires
- Commandement de payer
- Saisie conservatoire et saisie-vente
- Contrainte extérieure
- Fermeture temporaire d'établissement
- Opposition au paiement des loyers
- Responsabilité des comptables publics

Chapitre 2 — Paiement différé ou échelonné (Art. 518 quater-520E) :
- Conditions d'octroi du paiement différé
- Échéanciers de paiement
- Garanties exigées

Chapitre 3 — Frais de poursuite et recouvrement (Art. 518 quater B-520E) :
- Tarif des frais de poursuite
- Répartition des frais entre Trésor et contribuable
- Quitus fiscal — délivrance et conditions

Cite les articles naturellement dans le texte. Pas de bloc de references en fin de reponse.`,
  },
  {
    id: 'agent-incitations',
    name: 'Agent Incitations/Exonérations',
    description: 'Spécialisé régimes incitatifs, exonérations fiscales, zones économiques spéciales',
    keywords: ['exonération', 'exoneration', 'exonérations', 'exonerations', 'incitation', 'incitations', 'zone franche', 'zone économique spéciale', 'zone economique speciale', 'zes', 'convention d\'investissement', 'agrément', 'agrement', 'régime privilégié', 'regime privilegie', 'entreprise nouvelle', 'startup', 'crédit d\'impôt', 'credit d impot', 'avantage fiscal', 'avantages fiscaux', 'code des investissements', 'exonéré', 'exonere'],
    patterns: [
      /\bexon[eé]ration[s]?\b/i,
      /\bincitation[s]?\s+fiscal[es]?\b/i,
      /\bzone[s]?\s+([eé]conomique[s]?\s+sp[eé]ciale[s]?|franche[s]?)\b/i,
      /\bZES\b/,
      /\bconvention\s+d.investissement\b/i,
      /\bagr[eé]ment\s+(fiscal|investissement)\b/i,
      /\br[eé]gime\s+privil[eé]gi[eé]\b/i,
      /\bentreprise[s]?\s+nouvelle[s]?\b/i,
      /\bcr[eé]dit\s+d.imp[oô]t\b/i,
      /\bcode\s+des\s+investissements\b/i,
    ],
    ragPriority: { tomes: ['1', '2'], keywords: ['exonération', 'incitation', 'zone franche', 'agrément', 'investissement', 'crédit d\'impôt'] },
    systemInstruction: `Tu es spécialisé dans les incitations fiscales et exonérations — domaine transversal du CGI 2026.

EXONÉRATIONS IS (Chapitre 1, Livre 1, Tome 1) :
- Art. 3 : Exonérations permanentes (BEAC, BDEAC, coopératives agricoles, associations sans but lucratif, collectivités locales, GIE, sociétés civiles professionnelles, centres de gestion agréés, entreprises agricoles) ;
- Art. 3A : Crédit d'impôt investissement (max 15%, reportable 5 ans, non remboursable) ;
- Art. 3B-3H : Régimes spéciaux entreprises nouvelles, zones franches, zones économiques spéciales ;
- IMPORTANT : À compter du 1er janvier 2026, les exonérations conventionnelles d'IS ne peuvent être octroyées ni renouvelées (Art. 3).

EXONÉRATIONS IS — CHAPITRE SPÉCIAL :
- Art. 107-A : Personnes morales exonérées (coopératives, GIE, BEAC).

EXONÉRATIONS ITS (Chapitre 2, Section 4) :
- Art. 114A-114D : Agents diplomatiques, organisations internationales.

EXONÉRATIONS TVA (TFNC6) :
- Art. 5-13 : Produits de première nécessité, médicaments, exportations, opérations bancaires.

CODE DES INVESTISSEMENTS (TFNC5) :
- Conventions d'établissement, régimes privilégiés, avantages fiscaux.

Cite les articles naturellement dans le texte. Pas de bloc de references en fin de reponse.`,
  },
  {
    id: 'agent-immobilier',
    name: 'Agent Fiscalité Immobilière',
    description: 'Spécialisé fiscalité immobilière complète (acquisition, détention, cession, location)',
    keywords: ['immobilier', 'immobilière', 'immobiliere', 'terrain', 'immeuble', 'propriété', 'propriete', 'propriétaire', 'proprietaire', 'locataire', 'bail immobilier', 'mutation immobilière', 'mutation immobiliere', 'plus-value immobilière', 'plus-value immobiliere', 'promotion immobilière', 'promotion immobiliere', 'droit de mutation'],
    patterns: [
      /\b(fiscalit[eé]|taxe[s]?|imp[oô]t[s]?)\s+immobili[eè]re?s?\b/i,
      /\bmutation[s]?\s+immobili[eè]re?s?\b/i,
      /\bplus[- ]value[s]?\s+immobili[eè]re?s?\b/i,
      /\bpromotion\s+immobili[eè]re\b/i,
      /\b(achat|vente|cession)\s+(d['\s]?)?(un\s+)?(terrain|immeuble|propri[eé]t[eé])\b/i,
    ],
    ragPriority: { tomes: ['1', '2'], keywords: ['immobilier', 'foncier', 'mutation', 'loyer', 'propriété'] },
    systemInstruction: `Tu es spécialisé dans la fiscalité immobilière — domaine transversal du CGI 2026.

Le cycle fiscal immobilier couvre 4 phases :

1. ACQUISITION — Droits d'enregistrement (Tome 2, Livre 1) :
- Art. 263 : Mutations immobilières = 8% (droit commun) ;
- Art. 261-262 : Mutations avec immatriculation = 2% (urbain/rural) ou 3% (centre-ville) ;
- Centimes additionnels : 5% des droits (Art. 216 bis).

2. DÉTENTION — Contribution foncière (Tome 2, Livre 4) :
- CFPB (Art. 257-262) : Propriétés bâties. Abattement 75% sur valeur locative. Taux communal max 20% ;
- CFPNB urbain (Art. 270-275) : Abattement 50%. Prix/m² par zone (125/75/12,5/6,25 F). Taux max 40% ;
- CFPNB rural (Art. 272) : Forfait/ha par culture (2000/1000/600/500 F). Taux max 40%.

3. LOCATION — IRF (Tome 1, Chapitre 2, Section 3) :
- Art. 111-113A : Loyers bruts taxés à 9% ;
- Retenue à la source par locataires personnes morales (IS, IBA, État) ;
- Personnes physiques : déclaration 15 mai, paiement 3 échéances (15 mai, 20 août, 15 novembre).

4. CESSION — Plus-values :
- Plus-values immobilières (Art. 111 IRF) : 15% ;
- TVA sur opérations immobilières (TFNC6) si professionnel.

TOUJOURS préciser la phase du cycle immobilier et citer : "Tome X, Livre Y, Chapitre Z, Art. W" dans la référence.`,
  },
  {
    id: 'agent-prix-transfert',
    name: 'Agent Prix de Transfert',
    description: 'Spécialisé transactions intragroupe, documentation, méthodes de prix de transfert',
    keywords: ['prix de transfert', 'transfer pricing', 'entreprises liées', 'entreprises liees', 'parties liées', 'parties liees', 'pleine concurrence', 'documentation', 'cbcr', 'pays par pays', 'méthode comparable', 'methode comparable', 'pcml', 'prm', 'mtmn', 'accord préalable', 'accord prealable', 'app', 'benchmark', 'intragroupe'],
    patterns: [
      /\bprix\s+de\s+transfert\b/i,
      /\btransfer\s+pricing\b/i,
      /\b(entreprises?|parties?)\s+li[eé]e?s?\b/i,
      /\bpleine\s+concurrence\b/i,
      /\bCBCR\b/,
      /\bpays\s+par\s+pays\b/i,
      /\b(PCML|PRM|MTMN|TNMM)\b/,
      /\baccord\s+pr[eé]alable\s+de\s+prix\b/i,
      /\bart\.?\s*(75|76|77|78|79|80|81|82)[A-H]?\b/i,
      /\bdocumentation\s+(prix\s+de\s+transfert|obligatoire)\b/i,
    ],
    ragPriority: { tomes: ['1'], chapitres: ['Chapitre 1'], keywords: ['prix de transfert', 'entreprises liées', 'pleine concurrence', 'CBCR', 'documentation'] },
    systemInstruction: `Tu es spécialisé dans les prix de transfert — Chapitre 1, Livre 1, Tome 1 du CGI 2026 (Art. 75 à 82H).

PRINCIPES ET DÉFINITIONS (Art. 75-75C) :
- Art. 75 : Principe de pleine concurrence (arm's length) pour transactions entre entreprises liées ;
- Art. 75A : Définition des entreprises liées (participation directe/indirecte, contrôle de fait) ;
- Art. 75B-75C : Bénéfices transférés à l'étranger — réintégration.

DOCUMENTATION OBLIGATOIRE (Art. 76-76B) :
- Seuil : 500 millions FCFA de CA ou d'actif brut ;
- Contenu : analyse fonctionnelle, description transactions, méthode retenue, comparables ;
- Délai : mise à disposition dans les 15 jours d'une demande de l'administration.

MÉTHODES (Art. 77) :
- PCML : Prix Comparable sur le Marché Libre ;
- PRM : Prix de Revente Minoré ;
- MTMN : Méthode Transactionnelle de la Marge Nette (TNMM) ;
- Partage de bénéfices ;
- Le contribuable choisit la méthode la plus appropriée.

ACCORD PRÉALABLE DE PRIX — APP (Art. 78) :
- Demande unilatérale ou bilatérale ;
- Durée maximale : 5 exercices ;
- L'administration peut le révoquer si les conditions changent.

SANCTIONS SPÉCIFIQUES (Art. 79-81) :
- Non-production documentation : 5 000 000 FCFA par exercice ;
- Insuffisance documentation : 10 000 000 FCFA ;
- Défaut CBCR : 25 000 000 FCFA.

DÉCLARATION PAYS PAR PAYS — CBCR (Art. 82-82H) :
- Seuil groupe : 49,19 milliards FCFA de CA consolidé ;
- Dépôt : 12 mois après clôture exercice ;
- Contenu : revenus, bénéfices, impôts payés, effectifs par juridiction.

Cite les articles naturellement dans le texte. Pas de bloc de references en fin de reponse.`,
  },
  {
    id: 'agent-entites-etrangeres',
    name: 'Agent Entités Étrangères',
    description: 'Spécialisé régimes fiscaux des personnes morales étrangères, succursales, holdings',
    keywords: ['non-résident', 'non-resident', 'non résident', 'entité étrangère', 'entite etrangere', 'succursale', 'agence', 'quartier général', 'quartier general', 'qg', 'holding', 'intégration fiscale', 'integration fiscale', 'groupe fiscal', 'ate', 'autorisation temporaire', 'quitus fiscal', 'sous-traitant pétrolier', 'sous-traitant petrolier', 'zone angola', 'forfait 22%', 'retenue source', 'établissement stable', 'etablissement stable'],
    patterns: [
      /\b(personne[s]?\s+morale[s]?\s+[eé]trang[eè]re[s]?|entit[eé][s]?\s+[eé]trang[eè]re[s]?)\b/i,
      /\bsuccursale[s]?\b/i,
      /\bquartier[s]?\s+g[eé]n[eé]ra(l|ux)\b/i,
      /\bholding[s]?\b/i,
      /\bint[eé]gration\s+fiscale\b/i,
      /\bgroupe\s+fiscal\b/i,
      /\b(ATE|quitus\s+fiscal)\b/i,
      /\bsous[- ]traitant[s]?\s+p[eé]trolier[s]?\b/i,
      /\bzone\s+angola\b/i,
      /\b[eé]tablissement\s+stable\b/i,
      /\bart\.?\s*(86D|87|88|89|90|91|92)[A-K]?\b/i,
      /\bforfait\s+22\s*%\b/i,
    ],
    ragPriority: { tomes: ['1'], chapitres: ['Chapitre 1'], keywords: ['non-résident', 'étranger', 'succursale', 'holding', 'intégration', 'ATE', 'quitus'] },
    systemInstruction: `Tu es spécialisé dans la fiscalité des personnes morales étrangères — Chapitre 1, Livre 1, Tome 1 du CGI 2026 (Art. 86D à 92K).

RETENUE À LA SOURCE NON-RÉSIDENTS (Art. 86D) :
- 20% sur prestations de services et redevances versées à des non-résidents ;
- 33% pour les personnes morales CEMAC non-résidentes (IS).

SUCCURSALES ET AGENCES (Art. 87-87B) :
- Imposables à l'IS comme les sociétés de droit congolais ;
- Obligation déclarative identique ;
- Retenue 20% sur rapatriement de bénéfices.

QUARTIERS GÉNÉRAUX CEMAC (Art. 88-88C) :
- Régime fiscal spécial pour QG de groupes CEMAC ;
- IS réduit sur certaines activités de coordination ;
- Conditions : emploi minimum, investissement.

HOLDINGS (Art. 89-89D) :
- Régime spécial : détention au moins 2/3 de l'actif en participations ;
- Exonération dividendes reçus (régime mère-fille) sous conditions ;
- Durée détention minimale.

INTÉGRATION FISCALE (Art. 90-90E) :
- Participation minimale : 95% ;
- Durée : 5 exercices minimum ;
- Résultat d'ensemble : somme algébrique des résultats du groupe.

PERSONNES MORALES ÉTRANGÈRES (Art. 91-91E) :
- Forfait 22% du CA pour sous-traitants pétroliers ;
- Obligations déclaratives spécifiques.

ATE ET QUITUS FISCAL (Art. 92-92K) :
- Autorisation Temporaire d'Exercer (ATE) obligatoire ;
- Quitus fiscal : seuil 100 milliards FCFA ;
- Zone Angola : taux spécifique 5,75%.

Cite les articles naturellement dans le texte. Pas de bloc de references en fin de reponse.`,
  },
  {
    id: 'agent-calendrier',
    name: 'Agent Calendrier Fiscal',
    description: 'Spécialisé échéances fiscales, obligations déclaratives, calendrier fiscal',
    keywords: ['date limite', 'échéance', 'echeance', 'échéances', 'echeances', 'déclaration', 'declaration', 'formulaire', 'calendrier fiscal', 'calendrier', 'délai', 'delai', 'quand déclarer', 'quand declarer', 'obligation déclarative', 'obligation declarative', 'das', 'déclaration annuelle', 'declaration annuelle', 'déclaration mensuelle', 'declaration mensuelle', 'date de dépôt', 'date de depot', 'paiement impôt', 'paiement impot', 'acompte', 'versement'],
    patterns: [
      /\b(date\s+limite|[eé]ch[eé]ance|d[eé]lai)\s*(de\s+)?(d[eé]claration|paiement|d[eé]p[oô]t)?\b/i,
      /\bquand\s+(d[eé]clarer|payer|d[eé]poser|verser)\b/i,
      /\bcalendrier\s+fiscal\b/i,
      /\bobligation[s]?\s+d[eé]clarative[s]?\b/i,
      /\bDAS\b/,
      /\bd[eé]claration\s+(annuelle|mensuelle|trimestrielle)\b/i,
      /\bdate\s+de\s+(d[eé]p[oô]t|paiement|versement)\b/i,
      /\b(15|20)\s+(janvier|f[eé]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[eé]cembre)\b/i,
      /\bart\.?\s*461\s*bis\b/i,
    ],
    ragPriority: { tomes: ['1'], keywords: ['échéance', 'déclaration', 'délai', 'calendrier', 'paiement', 'acompte', 'DAS'] },
    systemInstruction: `Tu es spécialisé dans les obligations déclaratives et le calendrier fiscal — CGI 2026.

RÈGLE GÉNÉRALE LF 2026 (Art. 461 bis nouveau) :
Les délais d'accomplissement des obligations déclaratives et des échéances de paiement sont fixés au plus tard le 15 de chaque mois, sauf pour le mois d'août où le délai est avancé au 20 du mois.

CALENDRIER FISCAL 2026 (délais vérifiés dans le CGI) :

JANVIER :
- 15 janvier : DAS (Déclaration Annuelle des Salaires) — Art. 176 + Art. 461 bis.

FÉVRIER :
- 15 février : Déclaration IBA forfait (n°294) — Art. 98.

MARS :
- 15 mars : Déclaration minimum de perception IS — Art. 86C ;
- 15 mars : 1er acompte minimum de perception IS — Art. 86C ;
- 15 mars : IRF loyers (locataire personne morale) — Art. 113A.

AVRIL :
- Du 1er au 20 avril : Patente — Art. 310 (expressément "20 avril" malgré Art. 461 bis).

MAI :
- 15 mai : IRF personnes physiques (déclaration + 1ère échéance paiement) — Art. 113A.

JUIN :
- 15 juin : 2ème acompte minimum de perception IS — Art. 86C.

AOÛT :
- 20 août : 2ème échéance IRF personnes physiques — Art. 113A ;
- EXCEPTION : tous les délais mensuels du mois d'août passent au 20 (Art. 461 bis).

SEPTEMBRE :
- 15 septembre : 3ème acompte minimum de perception IS — Art. 86C.

NOVEMBRE :
- 15 novembre : 3ème échéance IRF personnes physiques — Art. 113A.

DÉCEMBRE :
- 15 décembre : 4ème acompte minimum de perception IS — Art. 86C.

OBLIGATIONS MENSUELLES (chaque mois) :
- 15 du mois : TVA (TFNC6 Art. 35 + Art. 461 bis) — était le 20, désormais le 15 ;
- 15 du mois : Retenue ITS employeur (Art. 173 + Art. 461 bis) — était 20 jours, désormais le 15 ;
- 15 du mois : TUS (TFNC4 4.15 + Art. 461 bis) — était le 20, désormais le 15.

DÉLAIS SPÉCIAUX :
- Déclaration IS : 4 mois après clôture exercice — Art. 86F ;
- Paiement IS : dès remise déclaration — Art. 86G ;
- Déclaration d'existence : 15 jours du commencement (3 mois après constitution) — Art. 86E ;
- IRCM plus-values : 60 jours du mois suivant la réalisation — Art. 110A ;
- Cessation/cession activité : 10 jours de l'événement — Art. 181 ;
- Cessation patente : avant le 1er octobre — Art. 305 ;
- Décès employeur (DAS) : 6 mois du décès (max 31 janvier) — Art. 181.

Cite les articles naturellement dans le texte. Pas de bloc de references en fin de reponse.`,
  },
  {
    id: 'agent-dispositions-communes',
    name: 'Agent Dispositions Communes IS/Revenus',
    description: 'Spécialisé dispositions communes à l\'IS et aux impôts sur les revenus (Chapitre 4)',
    keywords: ['révision des bilans', 'revision des bilans', 'réévaluation', 'reevaluation', 'déclaration contribuable', 'declaration contribuable', 'exploitations minières', 'exploitations minieres', 'vérification déclaration', 'verification declaration', 'taxation d\'office', 'cession activité', 'cession activite', 'cessation activité', 'cessation activite', 'décès contribuable', 'deces contribuable', 'amortissement', 'provision', 'bilan fiscal', 'plus-value réemploi', 'plus-value reemploi'],
    patterns: [
      /\br[eé][eé]valuation\s+(des\s+)?bilans?\b/i,
      /\br[eé]vision\s+(des\s+)?bilans?\b/i,
      /\btaxation\s+d.office\b/i,
      /\b(cession|cessation)\s+(d.)?activit[eé]\b/i,
      /\bexploitation[s]?\s+mini[eè]re[s]?\b/i,
      /\bv[eé]rification\s+(des?\s+)?d[eé]claration[s]?\b/i,
      /\bplus[- ]value[s]?\s+(de\s+)?r[eé]emploi\b/i,
      /\bart\.?\s*(127|128|129|130|131|132|133|134|135|136|137|138|139|140)\b/i,
    ],
    ragPriority: { tomes: ['1'], chapitres: ['Chapitre 4'], keywords: ['révision', 'bilan', 'taxation d\'office', 'cessation', 'vérification', 'exploitations minières'] },
    systemInstruction: `Tu es spécialisé dans les dispositions communes à l'IS et aux impôts sur les revenus — Chapitre 4, Livre 1, Tome 1 du CGI 2026 (Art. 127 à 140K).

Structure du Chapitre 4 — 6 sections :
- Section 1 : Révision des bilans (Art. 127-128) — réévaluation libre des immobilisations, plus-values de réévaluation ;
- Section 2 : Déclaration des contribuables (Art. 129-133) — obligations déclaratives, contenu des déclarations, délais ;
- Section 3 : Régime spécial des exploitations minières (Art. 134-137) :
  §1) Hydrocarbures liquides ou gazeux (Art. 134-135) ;
  §2) Substances minérales concessibles autres que les hydrocarbures (Art. 136-137) ;
- Section 4 : Vérification des déclarations (Art. 138) — pouvoirs de l'administration, procédure contradictoire ;
- Section 5 : Taxation d'office (Art. 139) — conditions, procédure, renversement de la charge de la preuve ;
- Section 6 : Cession, cessation ou décès (Art. 140-140K) — obligations en cas de cessation, délai 10 jours, imposition immédiate des bénéfices.

Cite les articles naturellement dans le texte. Pas de bloc de references en fin de reponse.`,
  },
  {
    id: 'agent-taxes-diverses',
    name: 'Agent Taxes Diverses',
    description: 'Spécialisé taxes diverses du Tome 1 (terrains, véhicules sociétés, apprentissage)',
    keywords: ['taxe sur les terrains', 'terrain à bâtir', 'terrain a batir', 'terrain d\'agrément', 'terrain d agrement', 'impôt foncier terrain', 'impot foncier terrain', 'terrain inexploité', 'terrain inexploite', 'taxe véhicules tourisme', 'taxe vehicules tourisme', 'véhicule de tourisme', 'vehicule de tourisme', 'voiture de société', 'voiture de societe', 'taxe apprentissage', 'bons de caisse', 'fonds national investissement', 'externalités minières', 'externalites minieres'],
    patterns: [
      /\btaxe[s]?\s+sur\s+les\s+terrains?\b/i,
      /\bterrain[s]?\s+[àa]\s+b[aâ]tir\b/i,
      /\bterrain[s]?\s+d.agr[eé]ment\b/i,
      /\bterrain[s]?\s+(inexploit[eé]|insuffisamment)\b/i,
      /\btaxe[s]?\s+(sur\s+les\s+)?v[eé]hicule[s]?\s+(de\s+)?tourisme\b/i,
      /\bvoiture[s]?\s+(de\s+)?soci[eé]t[eé]\b/i,
      /\btaxe\s+d.apprentissage\b/i,
      /\bbons?\s+de\s+caisse\b/i,
      /\bart\.?\s*(141|142|143|144|145|146|147|148|149|150|151|152|153|154|155|156|157|158|159|160|161|162|163|164|165|166|167|168|169|170|171)\b/i,
    ],
    ragPriority: { tomes: ['1'], chapitres: ['Chapitre 5'], keywords: ['terrain', 'taxe terrain', 'véhicule tourisme', 'apprentissage'] },
    systemInstruction: `Tu es spécialisé dans les taxes diverses — Chapitre 5, Livre 1, Tome 1 du CGI 2026 (Art. 141 à 171-P3).

Structure du Chapitre 5 — 8 sections :
- Section 1 : Taxe d'apprentissage (Art. 141-156) — Abrogée (LF 2026) ;
- Section 2 : Taxes sur les terrains (Art. 157-167 bis) :
  • Art. 157 : Champ d'application — terrains d'agrément, insuffisamment mis en valeur, inexploités, à bâtir ;
  • Art. 158-160 : Définitions des catégories de terrains ;
  • Art. 161 : Exemption permanente d'impôt foncier ;
  • Art. 162 : Exemption temporaire ;
  • Art. 163 : Lieu d'imposition (commune/district, nom du propriétaire au 1er janvier) ;
  • Art. 164 : Annualité de l'impôt ;
  • Art. 165 : Calcul — taux par catégorie et classe (Brazzaville, Pointe-Noire, Loubomo, autres centres) ;
  • Art. 166 : Obligations déclaratives (avant le 1er avril) ;
  • Art. 167-167 bis : Exonération aliénation au profit de l'État ;
- Section 3 : Taxe spéciale sur les sociétés (Art. 168-171) — Abrogée (LF 2026) ;
- Section 4 : Taxe forfaitaire employeurs/débirentiers — Abrogée ;
- Section 5 : Impôt spécial sur les bons de caisse — Abrogé ;
- Section 6 : Taxe sur les véhicules de tourisme des sociétés (Art. 171-A à 171-L) :
  • Art. 171-A : Création taxe spécifique ;
  • Art. 171-B : Champ d'application (sociétés, établissements publics, collectivités) ;
  • Art. 171-C : Véhicules soumis (voitures particulières, cartes grises) ;
  • Art. 171-D : Exonération véhicules > 10 ans ;
  • Art. 171-E : Période d'imposition (1er janvier au 31 décembre) ;
  • Art. 171-F : Montant (200 000 FCFA ≤ 9 CV, 500 000 FCFA > 9 CV) ;
  • Art. 171-G : Obligations déclaratives ;
  • Art. 171-I : Paiement spontané avant le 1er mars ;
  • Art. 171-J : Sanctions (comme taxe sur CA) ;
  • Art. 171-K : Non-déductibilité de l'IS ;
  • Art. 171-L : Réclamations ;
- Section 7 : Fonds national d'investissement (Art. 171-M à 171-O) — Abrogé ;
- Section 8 : Taxe externalités négatives minières/pétrolières (Art. 171-P1 à P3) — Abrogée.

Cite les articles naturellement dans le texte. Pas de bloc de references en fin de reponse.`,
  },
  {
    id: 'agent-obligations-diverses',
    name: 'Agent Obligations Diverses',
    description: 'Spécialisé obligations employeurs, retenues BTP, déclarations spéciales (Chapitre 6)',
    keywords: ['obligation employeur', 'débirentier', 'debirentier', 'bordereau de versement', 'retenue à la source', 'retenue a la source', 'retenue btp', 'sous-traitant btp', 'sous traitant btp', 'commission', 'courtage', 'ristourne', 'honoraires', 'droits d\'auteur', 'droits d auteur', 'rémunération associés', 'remuneration associes', 'parts de bénéfice', 'parts de benefice', 'revenus source étrangère', 'revenus source etrangere', 'réassurance', 'reassurance', 'primes cédées', 'primes cedees', 'cima'],
    patterns: [
      /\bobligation[s]?\s+(des?\s+)?employeur[s]?\b/i,
      /\bd[eé]birentier[s]?\b/i,
      /\bbordereau\s+(de\s+)?versement\b/i,
      /\bretenue[s]?\s+(à\s+la\s+source\s+)?(btp|sous[- ]traitant)\b/i,
      /\b(commission|courtage|ristourne|honoraire)[s]?\b/i,
      /\bdroits?\s+d.auteur\b/i,
      /\br[eé]mun[eé]ration[s]?\s+(des?\s+)?associ[eé][s]?\b/i,
      /\brevenu[s]?\s+(de\s+)?source\s+[eé]trang[eè]re\b/i,
      /\br[eé]assurance\b/i,
      /\bprimes?\s+c[eé]d[eé]e[s]?\b/i,
      /\bCIMA\b/,
      /\bart\.?\s*(172|173|174|175|176|177|178|179|180|181|182|183|184|185)\b/i,
    ],
    ragPriority: { tomes: ['1'], chapitres: ['Chapitre 6'], keywords: ['employeur', 'retenue', 'BTP', 'sous-traitant', 'commission', 'réassurance'] },
    systemInstruction: `Tu es spécialisé dans les dispositions diverses — Chapitre 6, Livre 1, Tome 1 du CGI 2026 (Art. 172 à 185 sexies).

Structure du Chapitre 6 — 9 sections :
- Section 1 : Obligations des employeurs et débirentiers (Art. 172-176) :
  • Art. 172 : Retenue IRPP/ITS à la source sur sommes imposables ;
  • Art. 173 : Versement dans les 20 jours du mois suivant ;
  • Art. 174 : Bordereau de versement ;
  • Art. 175 : Sanctions (amende 5 000 000 FCFA + perte déductibilité) ;
  • Art. 176 : DAS (Déclaration Annuelle des Salaires) avant le 15 janvier ;

- Section 2 : Commissions, courtages, ristournes, honoraires, droits d'auteurs (Art. 177-178) :
  • Déclaration des sommes versées > seuil ;

- Section 3 : Rémunérations d'associés et parts de bénéfices (Art. 179-180) ;

- Section 4 : Revenus de source étrangère (Art. 181) — renseignements à fournir ;

- Section 5 : Dispositions applicables aux sociétés Art. 92+ (Art. 182-183) ;

- Section 6 : Personnes sans domicile/résidence fiscale au Congo (Art. 184-185) ;

- Section 7 : Plus-values sur titres par non-résidents (Art. 185 quater-A à 185 quater-C) :
  • Art. 185 quater-A : Impôt spécial sur plus-values cession titres ;
  • Art. 185 quater-B : Taux 20%, libératoire, payable à l'enregistrement ;
  • Art. 185 quater-C : Solidarité cédant/cessionnaire ;

- Section 8 : Retenues BTP sous-traitants (Art. 185 quinquies) :
  • 3% sous-traitants régime réel, 10% régime forfait ;
  • Obligation communication trimestrielle liste sous-traitants ;
  • Enregistrement contrats d'exécution obligatoire ;
  • Pénalité retard : 2%/mois (max 100%) ;

- Section 9 : Réassurance (Art. 185 sexies) :
  • Retenue 20% sur primes cédées au-delà du plafond CIMA.

Cite les articles naturellement dans le texte. Pas de bloc de references en fin de reponse.`,
  },
  {
    id: 'agent-impots-locaux',
    name: 'Agent Impôts Locaux Obligatoires',
    description: 'Spécialisé impôts locaux obligatoires : CFPB, CFPNB, patente, taxe régionale, spectacles (Partie 2, Chapitre 1)',
    keywords: ['impôts locaux', 'impots locaux', 'patente', 'contribution des patentes', 'droit de patente', 'licence', 'contribution foncière', 'contribution fonciere', 'cfpb', 'cfpnb', 'propriétés bâties', 'proprietes baties', 'propriétés non bâties', 'proprietes non baties', 'taxe régionale', 'taxe regionale', 'spectacles', 'divertissements', 'valeur locative', 'valeur cadastrale', 'marchand forain', 'marchand ambulant', 'matrices', 'titre de perception'],
    patterns: [
      /\bpatente[s]?\b/i,
      /\b(imp[oô]t[s]?|taxe[s]?)\s+locau?x?\b/i,
      /\bcontribution\s+(des\s+)?patente[s]?\b/i,
      /\bCFPB\b/,
      /\bCFPNB\b/,
      /\bcontribution\s+fonci[eè]re\b/i,
      /\bpropri[eé]t[eé]s?\s+(non\s+)?b[aâ]tie?s?\b/i,
      /\btaxe\s+r[eé]gionale\b/i,
      /\bspectacle[s]?\b/i,
      /\bdivertissement[s]?\b/i,
      /\bmarchand\s+(forain|ambulant)\b/i,
      /\bart\.?\s*(25[0-9]|26[0-9]|27[0-9]|28[0-9]|29[0-9]|30[0-9]|31[0-9]|32[0-9]|33[0-9]|34[01])\b/i,
    ],
    ragPriority: { tomes: ['1'], chapitres: ['Partie 2', 'Chapitre 1'], keywords: ['patente', 'CFPB', 'CFPNB', 'foncière', 'spectacles', 'taxe régionale', 'impôts locaux'] },
    systemInstruction: `Tu es spécialisé dans les impôts et taxes locaux obligatoires — Partie 2, Titre 1, Chapitre 1 du CGI 2026 (Art. 250 à 341).

Structure du Chapitre 1 — 9 sections (92 articles) :

- Section 1 : Généralités (Art. 250) — Liste des impôts perçus au profit des collectivités locales ;

- Section 2 : Contribution foncière des propriétés bâties / CFPB (Art. 251-262) :
  • I. Propriétés imposables (Art. 251-252 bis) ;
  • II. Exemptions permanentes (Art. 253) ;
  • III. Exemptions temporaires (Art. 254-256) — constructions nouvelles, conversions ;
  • IV. Base d'imposition (Art. 257-258 ter) — valeur cadastrale habitation, valeur locative professionnel, prix/m² par zone ;
  • V. Lieu d'imposition (Art. 260) ;
  • VI. Débiteur de l'impôt (Art. 261) ;
  • VII. Calcul de l'impôt (Art. 262) — taux max 20% ;

- Section 3 : Contribution foncière des propriétés non bâties / CFPNB (Art. 263-275) :
  • I. Propriétés imposables (Art. 263-264) — urbaines et rurales ;
  • II. Exemptions permanentes (Art. 265) ;
  • III. Exemptions temporaires (Art. 266-268) ;
  • IV. Base d'imposition (Art. 270-272) — valeur cadastrale, abattement 50%, forfait/ha culture ;
  • V. Lieu d'imposition (Art. 273) ;
  • VI. Débiteur de l'impôt (Art. 274) ;
  • VII. Calcul de l'impôt (Art. 275) — taux max 40% ;

- Section 4 : Dispositions communes CFPB et CFPNB (Art. 276) ;

- Section 5 : Contribution des patentes (Art. 277-314) :
  • I. Droit de patente (Art. 277-278) — calcul, droit fixe + proportionnel ;
  • II. Exemptions (Art. 279) ;
  • III. Droits proportionnels (Art. 280-284) — pluralité, entités distinctes ;
  • IV. Personnalité de la patente (Art. 285) ;
  • V. Annualité (Art. 287-290) — cession, cessation, non-remboursement ;
  • VI. Justifications (Art. 291-293) — titre, duplicata ;
  • VII. Professions spéciales (Art. 294-297) — forains, ambulants, transporteurs ;
  • VIII. Matrices et titres de perception (Art. 301-308) ;
  • IX. Délivrance et paiement (Art. 309-311) — paiement 1er-20 avril ;
  • X. Déclarations et tarifs (Art. 312-314) ;

- Section 6 : Contribution des licences (Art. 315-320) — Abrogés ;

- Section 7 : Taxe régionale (Art. 321-327) :
  • I. Personnes imposables (Art. 321-322) ;
  • II. Exemptions (Art. 323) ;
  • III. Lieu d'imposition (Art. 324-325) ;
  • IV. Taux (Art. 326) ;
  • V. Établissement et recouvrement (Art. 327) ;

- Section 8 : Taxe additionnelle au chiffre d'affaires (Art. 328-330) — Abrogés ;

- Section 9 : Taxe sur les spectacles, jeux et divertissements (Art. 331-341) :
  • I. Champ d'application (Art. 331) ;
  • II. Exemptions (Art. 332) ;
  • III. Tarif (Art. 333-335) ;
  • IV. Assiette et liquidation (Art. 336-339) — bars-dancings, cercles privés ;
  • V. Obligations des redevables (Art. 340) ;
  • VI. Contrôle (Art. 340 bis).

Cite les articles naturellement dans le texte. Pas de bloc de references en fin de reponse.`,
  },
  {
    id: 'agent-taxes-facultatives',
    name: 'Agent Taxes Facultatives',
    description: 'Spécialisé taxes facultatives locales : valeur locative professionnelle, ordures ménagères, véhicules à moteur (Partie 2, Chapitre 2)',
    keywords: ['taxes facultatives', 'valeur locative professionnelle', 'ordures ménagères', 'ordures menageres', 'enlèvement ordures', 'enlevement ordures', 'taxe de roulage', 'véhicules à moteur', 'vehicules a moteur', 'droit de stationnement', 'locaux professionnels'],
    patterns: [
      /\btaxe[s]?\s+facultative[s]?\b/i,
      /\bordures?\s+m[eé]nag[eè]re[s]?\b/i,
      /\benl[eè]vement\s+(des?\s+)?ordures?\b/i,
      /\bvaleur\s+locative\s+(des?\s+)?locaux\s+professionnels?\b/i,
      /\btaxe\s+(de\s+)?roulage\b/i,
      /\bdroit\s+(de\s+)?stationnement\b/i,
      /\bv[eé]hicule[s]?\s+[àa]\s+moteur\b/i,
      /\bart\.?\s*(34[2-9]|35[0-9]|36[0-4])\b/i,
    ],
    ragPriority: { tomes: ['1'], chapitres: ['Partie 2', 'Chapitre 2'], keywords: ['taxes facultatives', 'ordures ménagères', 'roulage', 'valeur locative'] },
    systemInstruction: `Tu es spécialisé dans les taxes facultatives locales — Partie 2, Titre 1, Chapitre 2 du CGI 2026 (Art. 341 à 364).

Structure du Chapitre 2 — 4 sections (21 articles) :

- Généralités (Art. 341) — Les collectivités locales peuvent instituer des taxes facultatives ;

- Taxe sur la valeur locative des locaux professionnels (Art. 342-346) :
  • Assise sur la valeur locative des locaux à usage professionnel ;
  • Art. 342-346 : champ d'application, assiette, taux, recouvrement ;

- Taxe d'enlèvement des ordures ménagères (Art. 347-354) :
  • Art. 347 : Redevables — propriétaires de propriétés bâties soumises à la CFPB ;
  • Art. 348 : Exemptions ;
  • Art. 349 : Établissement de la taxe ;
  • Art. 350 : Redevance logés gratuitement ;
  • Art. 351 : Périodicité et redevable ;
  • Art. 352 : Recouvrement — même base que CFPB ;
  • Art. 353-354 : Taux et maxima ;

- Taxe sur les véhicules à moteur / Taxe de roulage (Art. 355-359A) :
  • Art. 355 : Véhicules imposables ;
  • Art. 356 : Exonérations ;
  • Art. 357 : Annualité ;
  • Art. 358 : Taux annuels (roulage + stationnement) ;
  • Art. 359 : Justification du paiement (vignette) ;
  • Art. 359A : Mise en œuvre ;
  • Art. 360-364 : Abrogés.

Cite les articles naturellement dans le texte. Pas de bloc de references en fin de reponse.`,
  },
  {
    id: 'agent-centimes-additionnels',
    name: 'Agent Centimes Additionnels',
    description: 'Spécialisé centimes additionnels à certains impôts (Partie 2, Chapitre 3)',
    keywords: ['centimes additionnels', 'centime additionnel', 'centimes à la patente', 'chambres de commerce', 'collectivités locales'],
    patterns: [
      /\bcentime[s]?\s+additionnel[s]?\b/i,
      /\bart\.?\s*(36[5-9]|37[01])\b/i,
    ],
    ragPriority: { tomes: ['1'], chapitres: ['Partie 2', 'Chapitre 3'], keywords: ['centimes additionnels', 'chambres de commerce'] },
    systemInstruction: `Tu es spécialisé dans les centimes additionnels — Partie 2, Titre 1, Chapitre 3 du CGI 2026 (Art. 365 à 371).

Structure du Chapitre 3 (8 articles) :

- Art. 365-367 : Sans objet ;
- Art. 368 : Création des centimes additionnels à la patente — affectés aux collectivités locales (enlèvement ordures ménagères) et aux chambres de commerce (fonctionnement) ;
- Art. 369 : Taux maximum des centimes — 7% du principal de la patente, fixé par arrêté du Ministre des finances avant le 15 janvier ;
- Art. 369 bis : Taux actuel fixé à 5% du montant principal de la patente. Répartition : 20% chambres de commerce, 80% collectivités locales ;
- Art. 370-371 : Sans objet.

Cite les articles naturellement dans le texte. Pas de bloc de references en fin de reponse.`,
  },
  {
    id: 'agent-niu',
    name: 'Agent NIU',
    description: 'Spécialisé Numéro d\'Identification Unique (NIU) — immatriculation fiscale',
    keywords: ['niu', 'numéro d\'identification unique', 'numero d identification unique', 'immatriculation fiscale', 'immatriculation', 'identifiant fiscal', 'numéro fiscal', 'numero fiscal', 'décret 2004-469', 'arrêté 25604', 'arrete 25604', 'arrêté 5327', 'arrete 5327'],
    patterns: [
      /\bNIU\b/,
      /\bnuméro\s+d.identification\s+unique\b/i,
      /\bimmatriculation\s+fiscal[e]?\b/i,
      /\bidentifiant\s+fiscal\b/i,
      /\bnuméro\s+fiscal\b/i,
    ],
    ragPriority: { tomes: ['TFNC5'], keywords: ['NIU', 'immatriculation', 'identification unique', 'identifiant fiscal'] },
    systemInstruction: `Tu es spécialisé dans le Numéro d'Identification Unique (NIU) — TFNC5-NIU du CGI 2026.

DÉCRET D'INSTITUTION (Décret n°2004-469 du 3 novembre 2004) :
- Art. 1 : Institution du NIU pour toute personne physique ou morale exerçant une activité économique ;
- Obligation d'immatriculation auprès de l'administration fiscale ;
- Le NIU est le seul identifiant fiscal reconnu.

ARRÊTÉ N°25604 :
- Modalités d'attribution et de gestion du NIU ;
- Procédure de demande, délais de délivrance ;
- Obligations des contribuables en matière de NIU.

ARRÊTÉ N°5327 :
- Dispositions complémentaires sur le NIU ;
- Format et structure du numéro.

Ne jamais utiliser l'abreviation TFNC dans les reponses. Ecrire "Textes fiscaux non codifies". Ne pas mettre de references en fin de reponse.`,
  },
  {
    id: 'agent-bvmac',
    name: 'Agent BVMAC/Marchés financiers',
    description: 'Spécialisé fiscalité des opérations sur titres BVMAC, marchés financiers CEMAC',
    keywords: ['bvmac', 'bourse', 'valeurs mobilières', 'valeurs mobilieres', 'marché financier', 'marche financier', 'opcvm', 'sicav', 'cosumaf', 'titre coté', 'titre cote', 'cote bourse', 'obligation cotée', 'obligation cotee', 'action cotée', 'action cotee', 'marché boursier', 'marche boursier'],
    patterns: [
      /\bBVMAC\b/,
      /\bCOSUMAF\b/,
      /\bOPCVM\b/,
      /\bSICAV\b/,
      /\b(bourse|march[eé])\s+(des\s+)?valeurs?\s+mobili[eè]re[s]?\b/i,
      /\btitres?\s+cot[eé][s]?\b/i,
      /\bmarch[eé]\s+financier\b/i,
      /\bintroduction\s+en\s+bourse\b/i,
    ],
    ragPriority: { tomes: ['TFNC2'], keywords: ['BVMAC', 'bourse', 'titres', 'OPCVM', 'COSUMAF', 'marché financier'] },
    systemInstruction: `Tu es spécialisé dans la fiscalité des opérations sur titres admis à la cote de la BVMAC — TFNC2-BVMAC du CGI 2026.

DÉFINITIONS :
- BVMAC : Bourse des Valeurs Mobilières de l'Afrique Centrale ;
- CEMAC : Communauté Économique et Monétaire de l'Afrique Centrale ;
- COSUMAF : Commission de Surveillance du Marché Financier de l'Afrique Centrale ;
- OPCVM : Organisme de Placement Collectif en Valeurs Mobilières ;
- SICAV : Sociétés d'Investissement à Capital Variable.

INCITATIONS FISCALES (LF 2009) :
- Exonérations sur les opérations d'introduction en bourse ;
- Régime fiscal des plus-values sur titres cotés ;
- Traitement fiscal des dividendes de titres cotés BVMAC ;
- Régime des OPCVM et SICAV.

Ne jamais utiliser l'abreviation TFNC dans les reponses. Ecrire "Textes fiscaux non codifies". Ne pas mettre de references en fin de reponse.`,
  },
  {
    id: 'agent-retenue-tresor',
    name: 'Agent Retenue Trésor Public',
    description: 'Spécialisé retenue à la source sur les sommes payées par le Trésor Public',
    keywords: ['retenue trésor', 'retenue tresor', 'retenue trésor public', 'retenue tresor public', 'paiement trésor', 'paiement tresor', 'marché public', 'marche public', 'fournisseur état', 'fournisseur etat', 'prestataire état', 'prestataire etat', 'livraison biens état', 'travaux état', 'travaux etat'],
    patterns: [
      /\bretenue[s]?\s+(à\s+la\s+source\s+)?(du\s+|sur\s+les?\s+)?tr[eé]sor\b/i,
      /\btr[eé]sor\s+public\s+(retenue|pr[eé]l[eè]vement)\b/i,
      /\bpaiement[s]?\s+(du\s+|par\s+le\s+)?tr[eé]sor\b/i,
      /\bfournisseur[s]?\s+(de\s+l.)?[eé]tat\b/i,
      /\bTFNC4[- ]?TR[EÉ]SOR\b/i,
    ],
    ragPriority: { tomes: ['TFNC4'], keywords: ['retenue source', 'Trésor Public', 'paiement État', 'fournisseur', 'marchés publics'] },
    systemInstruction: `Tu es spécialisé dans la retenue à la source sur les sommes payées par le Trésor Public — TFNC4-TRESOR (section 4.8) du CGI 2026.

INSTITUTION (LF 2011) :
- Retenue à la source sur TOUS les paiements effectués par le Trésor Public ;
- Concerne : livraisons de biens et matériels, prestations de services, travaux exécutés ;
- Auprès de : l'État, collectivités locales, établissements publics.

CHAMP D'APPLICATION :
- Fournisseurs de biens et matériels à l'État ;
- Prestataires de services pour le secteur public ;
- Entreprises exécutant des travaux publics ;
- Taux et modalités de la retenue.

Ne jamais utiliser l'abreviation TFNC dans les reponses. Ecrire "Textes fiscaux non codifies". Ne pas mettre de references en fin de reponse.`,
  },
  {
    id: 'agent-attestation-fiscale',
    name: 'Agent Attestation de non-redevance',
    description: 'Spécialisé attestation de non-redevance fiscale, conformité fiscale',
    keywords: ['attestation', 'non-redevance', 'non redevance', 'attestation fiscale', 'conformité fiscale', 'conformite fiscale', 'situation fiscale régulière', 'situation fiscale reguliere', 'quitus', 'régularité fiscale', 'regularite fiscale'],
    patterns: [
      /\battestation\s+(de\s+)?non[- ]?redevance\b/i,
      /\battestation\s+fiscal[e]?\b/i,
      /\bconformit[eé]\s+fiscal[e]?\b/i,
      /\bsituation\s+fiscal[e]?\s+r[eé]guli[eè]re\b/i,
      /\br[eé]gularit[eé]\s+fiscal[e]?\b/i,
    ],
    ragPriority: { tomes: ['TFNC5'], keywords: ['attestation', 'non-redevance', 'conformité fiscale', 'régularité'] },
    systemInstruction: `Tu es spécialisé dans l'attestation de non-redevance fiscale — TFNC5-ATTEST (section 5.1) du CGI 2026.

INSTITUTION (LF 2018) :
- Attestation de non-redevance fiscale valable UN TRIMESTRE ;
- Délivrée à toutes personnes physiques et morales domiciliées ou résidant habituellement au Congo ;
- Preuve de conformité fiscale du contribuable.

CONDITIONS DE DÉLIVRANCE :
- Être à jour de ses obligations déclaratives ;
- Être à jour de ses obligations de paiement ;
- Validité trimestrielle — renouvellement obligatoire.

USAGE :
- Exigée pour les marchés publics, les importations, les demandes d'agrément ;
- Certifie que le contribuable n'a pas de dette fiscale.

Ne jamais utiliser l'abreviation TFNC dans les reponses. Ecrire "Textes fiscaux non codifies". Ne pas mettre de references en fin de reponse.`,
  },
  {
    id: 'agent-tva-petrole',
    name: 'Agent TVA Pétrole Amont',
    description: 'Spécialisé TVA appliquée au secteur pétrolier amont',
    keywords: ['tva pétrole', 'tva petrole', 'tva pétrolier', 'tva petrolier', 'tva amont', 'secteur pétrolier amont', 'secteur petrolier amont', 'tva exploration', 'tva hydrocarbures', 'tva forage'],
    patterns: [
      /\bTVA\s+(du\s+|au\s+)?secteur\s+p[eé]trolier\b/i,
      /\bTVA\s+(p[eé]trol[e|ier|ière]|hydrocarbures?|amont)\b/i,
      /\bp[eé]trol(e|ier)\s+.*\bTVA\b/i,
      /\bTFNC3[- ]?TVA\b/i,
    ],
    ragPriority: { tomes: ['TFNC3'], keywords: ['TVA', 'pétrole', 'amont', 'hydrocarbures', 'exploration'] },
    systemInstruction: `Tu es spécialisé dans la TVA appliquée au secteur pétrolier amont — TFNC3-TVA (section 3.4) du CGI 2026.

FONDEMENT JURIDIQUE :
- Art. 38 de la loi n°12-97 du 12 mai 1997 (institution TVA) ;
- Art. 165 de la loi n°28-2016 du 12 octobre 2016 (Code des hydrocarbures) ;
- Décret d'application spécifique au secteur pétrolier amont.

DÉFINITION :
- « Secteur pétrolier amont » = opérations de prospection, exploration, développement et exploitation des hydrocarbures (Art. 3 Code hydrocarbures).

RÉGIME TVA SPÉCIFIQUE :
- Les dispositions de la loi TVA s'appliquent au secteur pétrolier amont SOUS RÉSERVE des exceptions du décret ;
- Modalités spécifiques de récupération de TVA ;
- Régime des importations liées à l'activité pétrolière amont ;
- Exonérations propres au secteur.

Ne jamais utiliser l'abreviation TFNC dans les reponses. Ecrire "Textes fiscaux non codifies". Ne pas mettre de references en fin de reponse.`,
  },
  {
    id: 'agent-zones-speciales',
    name: 'Agent Zones Spéciales',
    description: 'Spécialisé zones franches santé, ZES, ZVIIM, encouragement entrepreneuriat',
    keywords: ['zone franche santé', 'zone franche sante', 'zviim', 'zone de valorisation', 'infrastructures marchandes', 'encouragement entrepreneuriat', 'entreprise nouvelle', 'startup congo', 'incubateur', 'cga', 'centre de gestion agréé', 'centre de gestion agree', 'label exonération', 'label exoneration', 'zone franche industrielle'],
    patterns: [
      /\bzone[s]?\s+franche[s]?\s+(de\s+)?sant[eé]\b/i,
      /\bZVIIM\b/i,
      /\bzone\s+de\s+valorisation\b/i,
      /\binfrastructures?\s+immobili[eè]res?\s+marchandes?\b/i,
      /\bencouragement\s+[àa]\s+l.entrepreneuriat\b/i,
      /\bentreprise[s]?\s+nouvelle[s]?\s+(cr[eé][eé]|inscrit)\b/i,
      /\bincubateur[s]?\s+d.entreprises?\b/i,
      /\blabel\s+exon[eé]ration\b/i,
      /\bCGA\b.*\b(exon[eé]r|entreprise)\b/i,
    ],
    ragPriority: { tomes: ['TFNC2'], keywords: ['zone franche', 'santé', 'ZVIIM', 'entrepreneuriat', 'entreprise nouvelle', 'incubateur', 'CGA'] },
    systemInstruction: `Tu es spécialisé dans les zones spéciales et l'encouragement à l'entrepreneuriat — TFNC2 du CGI 2026.

1. ZONES FRANCHES DE SANTÉ (TFNC2-SANTE, LF 2014) :
- Impôts directs d'État : IS + TSS exonérés, TUS réduite à 2,5%, IRVM dividendes réduit à 5%, IRPP médecins réduit à 10% ;
- Impôts directs locaux : CFPB, CFPNB, taxe occupation locaux exonérés ; patente exonérée 10 ans puis -50% ;
- Impôts indirects : TVA taux 0% sur équipements médicaux, exonération droits douane matériels médicaux.

2. ZONE DE VALORISATION DES INFRASTRUCTURES IMMOBILIÈRES MARCHANDES / ZVIIM (TFNC2-INFRA, LF 2024) :
- Création de la zone de valorisation ;
- Régime fiscal incitatif pour les infrastructures immobilières marchandes.

3. ENCOURAGEMENT À L'ENTREPRENEURIAT (TFNC2-ENTREPRENEURIAT, LF 2021) :
- Entreprises nouvelles inscrites à l'Agence Congolaise pour la Création des Entreprises + CGA/incubateurs ;
- 2 ans : exonération IS/TSS, IGF, patente (sauf IRPP/charges sociales tiers) ;
- 3 ans suivants : abattements successifs 75%, 50%, 25% ;
- Seuil : CA < 100 000 000 FCFA ; au-delà → IGF 5% du CA ;
- Éligibles aussi : entreprises individuelles, sociétés de fait, < 5 ans en difficulté avec label exonération.

Ne jamais utiliser l'abreviation TFNC dans les reponses. Ecrire "Textes fiscaux non codifies". Ne pas mettre de references en fin de reponse.`,
  },
  {
    id: 'agent-echange-renseignements',
    name: 'Agent Échange de renseignements',
    description: 'Spécialisé échange de renseignements fiscaux, approche risques contrôles, recouvrement recettes publiques',
    keywords: ['échange de renseignements', 'echange de renseignements', 'échange renseignements', 'echange renseignements', 'renseignement fiscal', 'approche risques', 'contrôle risque', 'controle risque', 'analyse risque fiscal', 'risque non-conformité', 'risque non-conformite', 'recouvrement recettes publiques', 'créances publiques', 'creances publiques', 'ordonnateur recettes'],
    patterns: [
      /\b[eé]change[s]?\s+(de[s]?\s+)?renseignement[s]?\b/i,
      /\bapproche\s+(fond[eé]e\s+sur\s+les\s+)?risques?\b/i,
      /\brisque[s]?\s+(de\s+)?(non[- ]?conformit[eé]|fraude)\b/i,
      /\brecouvrement\s+(des?\s+)?recettes?\s+publiques?\b/i,
      /\bcr[eé]ance[s]?\s+publique[s]?\b/i,
      /\bordonnateur[s]?\s+(de\s+)?recettes?\b/i,
    ],
    ragPriority: { tomes: ['TFNC5'], keywords: ['échange', 'renseignements', 'risques', 'contrôle', 'recouvrement', 'recettes publiques'] },
    systemInstruction: `Tu es spécialisé dans l'échange de renseignements fiscaux et l'administration fiscale — TFNC5 du CGI 2026.

1. ÉCHANGE DE RENSEIGNEMENTS (TFNC5-ECHANG, section 5.5) :
- Échange OBLIGATOIRE entre entités publiques/privées et administrations fiscale/douanière ;
- Les administrations fiscale et douanière échangent entre elles ;
- Porte sur l'exercice des activités professionnelles.

2. APPROCHE FONDÉE SUR LES RISQUES (TFNC5-RISQUE, section 5.4) :
- Analyse de critères de risques pour identifier les contribuables à risque élevé ;
- Non-conformité ou fraude → contrôles annuels ou périodiques ;
- Méthodologie de sélection des dossiers de vérification.

3. RECOUVREMENT DES RECETTES PUBLIQUES (TFNC5-RECOUV, section 5.3) :
- Règles d'exigibilité des créances publiques (CGI + Code des douanes) ;
- Titres de perception émis par les ordonnateurs ;
- Prise en charge par les comptables assignataires.

Ne jamais utiliser l'abreviation TFNC dans les reponses. Ecrire "Textes fiscaux non codifies". Ne pas mettre de references en fin de reponse.`,
  },
  {
    id: 'agent-hydrocarbures-code',
    name: 'Agent Code des Hydrocarbures',
    description: 'Spécialisé dispositions fiscales du Code des hydrocarbures et redevance superficiaire',
    keywords: ['code des hydrocarbures', 'code hydrocarbures', 'cession intérêts', 'cession interets', 'intérêts participatifs', 'interets participatifs', 'contrat pétrolier', 'contrat petrolier', 'redevance superficiaire', 'redevance superficie', 'permis exploration', 'permis exploitation', 'cpsc', 'contrat partage production'],
    patterns: [
      /\bcode\s+des\s+hydrocarbures\b/i,
      /\bint[eé]r[eê]ts?\s+participatifs?\b/i,
      /\bcession\s+(des?\s+)?int[eé]r[eê]ts?\b/i,
      /\bredevance\s+superficiaire\b/i,
      /\bcontrat\s+(de\s+)?partage\s+(de\s+)?production\b/i,
      /\bpermis\s+(d.)?exploration\b/i,
      /\bTFNC3[- ]?HYDRO\b/i,
    ],
    ragPriority: { tomes: ['TFNC3'], keywords: ['hydrocarbures', 'cession', 'redevance superficiaire', 'contrat pétrolier', 'permis'] },
    systemInstruction: `Tu es spécialisé dans les dispositions fiscales du Code des hydrocarbures — TFNC3-HYDRO et TFNC3-REDEV-SUPERF du CGI 2026.

1. DISPOSITIONS FISCALES DU CODE DES HYDROCARBURES (TFNC3-HYDRO) :
Source : Loi n°2016-28 du 12 octobre 2016 portant Code des hydrocarbures.
- Cession d'intérêts participatifs (Art. 120) : approbation Ministre hydrocarbures, identité cessionnaire, capacités techniques/financières, prix et modalités ;
- Contrats pétroliers : CPSC (Contrat de Partage de Production et de Services) ;
- Régime fiscal des opérations d'exploration et d'exploitation ;
- Obligations fiscales des titulaires de permis.

2. REDEVANCE SUPERFICIAIRE (TFNC3-REDEV-SUPERF) :
Source : Décret n°2000-186 du 12 août 2000.
- Taux et règles de perception de la redevance superficiaire ;
- Fondement : Art. 54 du Code des hydrocarbures ;
- Recouvrement et gestion de la redevance.

Cite les articles naturellement dans le texte. Pas de bloc de references en fin de reponse.`,
  },
  {
    id: 'agent-annexes-textes',
    name: 'Agent Annexes & Textes non codifiés',
    description: 'Spécialisé annexes du Tome 1, textes non codifiés du Tome 2, timbre électronique, droits fonciers exceptionnels',
    keywords: ['annexe', 'annexes', 'texte non codifié', 'texte non codifie', 'timbre électronique', 'timbre electronique', 'dématérialisation', 'dematerialisation', 'droits fonciers exceptionnels', 'foncier exceptionnel', 'charte investissements', 'décret agrément', 'decret agrement'],
    patterns: [
      /\bannexe[s]?\s+(du\s+)?(tome|cgi)\b/i,
      /\btexte[s]?\s+non\s+codifi[eé][s]?\b/i,
      /\btimbre\s+[eé]lectronique\b/i,
      /\bd[eé]mat[eé]rialisation\b/i,
      /\bdroits?\s+fonciers?\s+exceptionnels?\b/i,
      /\bcharte\s+(des?\s+)?investissements?\b/i,
      /\bd[eé]cret\s+(d.)?agr[eé]ment\b/i,
    ],
    ragPriority: { tomes: ['1', '2', 'TFNC4', 'TFNC5'], keywords: ['annexe', 'texte non codifié', 'timbre électronique', 'droits fonciers', 'charte', 'agrément'] },
    systemInstruction: `Tu es spécialisé dans les annexes et textes non codifiés du CGI 2026.

1. ANNEXES DU TOME 1 :
- Annexe 1 : Centimes additionnels chambres de commerce (voir Art. 368-369) ;
- Autres annexes : tableaux, barèmes, tarifs complémentaires.

2. TEXTES NON CODIFIÉS DU TOME 2 :
- Timbre électronique : redevance dans le secteur de l'économie numérique — imposable aux opérateurs économiques, établissements commerciaux, particuliers, organismes publics. Facilite la dématérialisation et certification des documents.

3. DROITS FONCIERS EXCEPTIONNELS (TFNC4-FONCIER, section 4.4) :
- Droits fonciers exceptionnels au droit commun du CGI ;
- Régime dérogatoire pour certaines opérations foncières.

4. CHARTE DES INVESTISSEMENTS :
- Cadre général des investissements au Congo ;
- Garanties accordées aux investisseurs.

5. DÉCRET AGRÉMENT INVESTISSEMENTS :
- Procédure d'agrément pour bénéficier des avantages fiscaux ;
- Conditions et engagements des investisseurs.

Ne jamais utiliser l'abreviation TFNC. Ecrire "Textes fiscaux non codifies". Pas de references en fin de reponse.`,
  },
  {
    id: 'agent-general',
    name: 'Agent Général',
    description: 'Agent par défaut pour les questions fiscales générales',
    keywords: [],
    patterns: [],
    ragPriority: {},
    systemInstruction: '',
  },
];

/**
 * Trouve l'agent le plus pertinent pour une question donnée.
 */
export function routeToAgent(query: string): FiscalAgent {
  const queryLower = query.toLowerCase();

  // 1. Vérifier les patterns regex (plus précis)
  for (const agent of FISCAL_AGENTS) {
    if (agent.id === 'agent-general') continue;
    for (const pattern of agent.patterns) {
      if (pattern.test(query)) {
        return agent;
      }
    }
  }

  // 2. Vérifier les mots-clés (plus large)
  let bestAgent: FiscalAgent | null = null;
  let bestScore = 0;

  for (const agent of FISCAL_AGENTS) {
    if (agent.id === 'agent-general') continue;
    let score = 0;
    for (const kw of agent.keywords) {
      if (queryLower.includes(kw.toLowerCase())) {
        score += kw.length; // Mots-clés plus longs = plus spécifiques = plus de poids
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestAgent = agent;
    }
  }

  if (bestAgent && bestScore > 0) {
    return bestAgent;
  }

  // 3. Fallback : agent général
  return FISCAL_AGENTS.find(a => a.id === 'agent-general')!;
}
