import type { ArticleData, SommaireNode } from "./types";
import { parseArticles, normalize, type RawArticle } from "./helpers";
import type { SearchResult } from "./cgi";

// --- Types pour le sommaire social en mode Livre ---

type SectionEntry = {
  section: number;
  section_nom: string;
};

type ChapitreEntry = {
  chapitre: number | string;
  chapitre_nom: string;
  sections?: SectionEntry[];
  fichier?: string;
};

type TitreEntry = {
  titre: number;
  titre_nom: string;
  chapitres: ChapitreEntry[];
};

type PartieEntry = {
  partie: string;
  partie_nom: string;
  chapitres?: ChapitreEntry[];
  source?: string;
  description?: string;
};

type LivreEntry = {
  livre: number;
  livre_nom: string;
  parties: PartieEntry[];
};

type SommaireJSON = {
  meta: Record<string, unknown>;
  sommaire: TitreEntry[];
};

// --- Cache ---
let _socialSommaire: SommaireNode[] | null = null;
let _socialArticles: ArticleData[] | null = null;

// --- Chargement des fichiers JSON de données ---

const FILE_MAP: Record<string, () => { articles: RawArticle[] }> = {
  // Livre 1 - Code du travail (fichiers par titre)
  "travail-titre1": () => require("@/data/social/travail-titre1-dispositions-generales.json"),
  "travail-titre2-ch1": () => require("@/data/social/travail-titre2-chapitre1-apprentissage.json"),
  "travail-titre2-ch2": () => require("@/data/social/travail-titre2-chapitre2-contrat-individuel.json"),
  "travail-titre2-ch3": () => require("@/data/social/travail-titre2-chapitre3-conventions-collectives.json"),
  "travail-titre2-ch4": () => require("@/data/social/travail-titre2-chapitre4-sous-entreprise.json"),
  "travail-titre2-ch5": () => require("@/data/social/travail-titre2-chapitre5-travail-temporaire.json"),
  "travail-titre2-ch5b": () => require("@/data/social/travail-titre2-chapitre5-travail-temporaire-suite.json"),
  "travail-titre2-ch6": () => require("@/data/social/travail-titre2-chapitre6-reglement-interieur.json"),
  "travail-titre2-ch7": () => require("@/data/social/travail-titre2-chapitre7-cautionnement.json"),
  "travail-titre3": () => require("@/data/social/travail-titre3-salaire.json"),
  "travail-titre4": () => require("@/data/social/travail-titre4-conditions-travail.json"),
  "travail-titre5": () => require("@/data/social/travail-titre5-hygiene-securite.json"),
  "travail-titre6-ch1": () => require("@/data/social/travail-titre6-chapitre1-administration-travail.json"),
  "travail-titre6-ch4": () => require("@/data/social/travail-titre6-chapitre4-comites-entreprise.json"),
  "travail-titre6-ch5": () => require("@/data/social/travail-titre6-chapitre5-delegues-personnel.json"),
  "travail-titre6-ch6": () => require("@/data/social/travail-titre6-chapitre6-moyens-controle.json"),
  "travail-titre7": () => require("@/data/social/travail-titre7-syndicats.json"),
  "travail-titre8-ch1": () => require("@/data/social/travail-titre8-chapitre1-differend-individuel.json"),
  "travail-titre8-ch2": () => require("@/data/social/travail-titre8-chapitre2-differend-collectif.json"),
  "travail-titre9": () => require("@/data/social/travail-titre9-penalites.json"),
  "travail-titre10": () => require("@/data/social/travail-titre10-dispositions-transitoires.json"),

  // Livre 1 - Textes d'application
  "app-art39-lic": () => require("@/data/social/application-art39-licenciement.json"),
  "app-art39-com": () => require("@/data/social/application-art39-commission-litiges.json"),
  "app-art83": () => require("@/data/social/application-art83-smig.json"),
  "app-art105-duree": () => require("@/data/social/application-art105-duree-travail-heures-sup.json"),
  "app-art105-derog": () => require("@/data/social/application-art105-derogations-duree-travail.json"),
  "app-art105-hor": () => require("@/data/social/application-art105-horaires-services-publics.json"),
  "app-art135": () => require("@/data/social/application-art135-machines-dangereuses.json"),
  "app-art137-com": () => require("@/data/social/application-art137-comites-hygiene-securite.json"),
  "app-art137-mes": () => require("@/data/social/application-art137-mesures-hygiene-securite.json"),

  // Livre 1 - Textes non codifiés
  "onemo": () => require("@/data/social/loi-1988-22-onemo.json"),
  "acpe": () => require("@/data/social/loi-2019-7-acpe.json"),
  "jours-feries": () => require("@/data/social/loi-1994-02-jours-feries.json"),
  "journee-rep": () => require("@/data/social/loi-2010-18-journee-republique.json"),
  "fete-nat": () => require("@/data/social/loi-2010-19-fete-nationale.json"),
  "fonea": () => require("@/data/social/loi-2019-8-fonea.json"),
  "ints": () => require("@/data/social/loi-2015-06-ints.json"),
  "saisie-arret": () => require("@/data/social/decret-1984-209-saisie-arret-salaires.json"),
  "perso-dom": () => require("@/data/social/arrete-1868-personnel-domestique.json"),
  "oit": () => require("@/data/social/textes-non-codifies-conventions-oit.json"),

  // Livre 2 - Code de la sécurité sociale
  "css-general": () => require("@/data/social/code-securite-sociale-loi-004-86.json"),
  "css-famille": () => require("@/data/social/code-securite-sociale-prestations-familiales.json"),
  "css-risques": () => require("@/data/social/code-securite-sociale-risques-professionnels.json"),
  "css-risques2": () => require("@/data/social/code-securite-sociale-risques-pro-suite.json"),
  "css-pensions": () => require("@/data/social/code-securite-sociale-pensions.json"),
  "css-pensions2": () => require("@/data/social/code-securite-sociale-pensions-suite.json"),
  "css-contentieux": () => require("@/data/social/code-securite-sociale-contentieux-penalites.json"),

  // Livre 2 - Textes non codifiés sécu
  "age-retraite": () => require("@/data/social/loi-2024-48-age-retraite.json"),
  "sys-secu": () => require("@/data/social/loi-2011-31-systeme-securite-sociale.json"),
  "loi2012-p1": () => require("@/data/social/loi-2012-18-risques-pro-partie1.json"),
  "loi2012-p2": () => require("@/data/social/loi-2012-18-risques-professionnels.json"),
  "dissolution-cnss": () => require("@/data/social/loi-10-2014-dissolution-cnss.json"),
  "caisse-risques": () => require("@/data/social/loi-11-2014-caisse-risques-professionnels.json"),
  "caisse-famille": () => require("@/data/social/loi-12-2014-caisse-famille-enfance.json"),
  "camu-loi": () => require("@/data/social/loi-19-2023-camu.json"),
  "camu-statuts": () => require("@/data/social/decret-2023-1761-statuts-camu.json"),
  "camu-cotis": () => require("@/data/social/decret-2024-131-cotisations-camu.json"),
  "camu-taux": () => require("@/data/social/decret-2024-133-taux-cotisations-camu.json"),
  "tipl": () => require("@/data/social/arrete-31253-assiette-cotisations-tipl.json"),

  // Livre 2 - Conventions sécurité sociale
  "conv-france": () => require("@/data/social/convention-securite-sociale-france.json"),
  "conv-cipres": () => require("@/data/social/convention-securite-sociale-cipres.json"),

  // Livre 3 - Conventions collectives
  "cc-agri": () => require("@/data/social/conventions/cc-agri-foret.json"),
  "cc-aerien": () => require("@/data/social/conventions/cc-aerien.json"),
  "cc-aux-transp": () => require("@/data/social/conventions/cc-auxiliaires-transport.json"),
  "cc-bam": () => require("@/data/social/conventions/cc-bam.json"),
  "cc-btp": () => require("@/data/social/conventions/cc-btp.json"),
  "cc-commerce": () => require("@/data/social/conventions/cc-commerce.json"),
  "cc-mines": () => require("@/data/social/conventions/cc-exploitation-miniere.json"),
  "cc-foret": () => require("@/data/social/conventions/cc-forestiere.json"),
  "cc-hotel": () => require("@/data/social/conventions/cc-hotellerie-catering.json"),
  "cc-industrie": () => require("@/data/social/conventions/cc-industrie.json"),
  "cc-info": () => require("@/data/social/conventions/cc-information-communication.json"),
  "cc-ntic": () => require("@/data/social/conventions/cc-ntic.json"),
  "cc-parapetro": () => require("@/data/social/conventions/cc-para-petrole.json"),
  "cc-peche": () => require("@/data/social/conventions/cc-peche-maritime.json"),
  "cc-domestique": () => require("@/data/social/conventions/cc-personnel-domestique.json"),
  "cc-petrole": () => require("@/data/social/conventions/cc-petrole.json"),
};

/** Charge un fichier et parse ses articles (gère les deux formats : "articles" avec "article" ou "numero") */
function loadArticles(key: string): ArticleData[] {
  try {
    const data = FILE_MAP[key]();
    if (!data?.articles) return [];
    // Normaliser les articles qui utilisent "numero" au lieu de "article"
    const normalized = data.articles.map((a: any) => ({
      ...a,
      article: a.article || (a.numero ? `Art. ${a.numero}` : undefined),
      texte: a.texte || (a.contenu ? [a.contenu] : []),
    }));
    return parseArticles(normalized);
  } catch {
    return [];
  }
}

// --- Construction du sommaire en mode Livre ---

// Mapping titre du Code du travail → clé(s) FILE_MAP
const TRAVAIL_TITRE_MAP: Record<number, string[]> = {
  1: ["travail-titre1"],
  2: ["travail-titre2-ch1", "travail-titre2-ch2", "travail-titre2-ch3", "travail-titre2-ch4", "travail-titre2-ch5", "travail-titre2-ch5b", "travail-titre2-ch6", "travail-titre2-ch7"],
  3: ["travail-titre3"],
  4: ["travail-titre4"],
  5: ["travail-titre5"],
  6: ["travail-titre6-ch1", "travail-titre6-ch4", "travail-titre6-ch5", "travail-titre6-ch6"],
  7: ["travail-titre7"],
  8: ["travail-titre8-ch1", "travail-titre8-ch2"],
  9: ["travail-titre9"],
  10: ["travail-titre10"],
};

// Mapping chapitre spécifique → clé FILE_MAP
const TRAVAIL_CHAPITRE_MAP: Record<string, string> = {
  "2-1": "travail-titre2-ch1",
  "2-2": "travail-titre2-ch2",
  "2-3": "travail-titre2-ch3",
  "2-4": "travail-titre2-ch4",
  "2-5": "travail-titre2-ch5",
  "2-6": "travail-titre2-ch6",
  "2-7": "travail-titre2-ch7",
  "6-1": "travail-titre6-ch1",
  "6-4": "travail-titre6-ch4",
  "6-5": "travail-titre6-ch5",
  "6-6": "travail-titre6-ch6",
  "8-1": "travail-titre8-ch1",
  "8-2": "travail-titre8-ch2",
};

function buildCodeTravailNode(): SommaireNode {
  const travailData: SommaireJSON = require("@/data/social/sommaire-travail.json");
  const children: SommaireNode[] = travailData.sommaire.map((titre) => {
    const titreId = `social-t${titre.titre}`;

    if (titre.chapitres.length > 0) {
      // Titre avec chapitres : attacher les articles à chaque chapitre
      const chChildren: SommaireNode[] = titre.chapitres.map((ch) => {
        const chId = `${titreId}-ch${ch.chapitre}`;
        const chKey = `${titre.titre}-${ch.chapitre}`;
        const fileKey = TRAVAIL_CHAPITRE_MAP[chKey];
        const articles = fileKey ? loadArticles(fileKey) : [];

        const sChildren: SommaireNode[] | undefined =
          ch.sections && ch.sections.length > 0
            ? ch.sections.map((s) => ({
                id: `${chId}-s${s.section}`,
                label: `Section ${s.section} : ${s.section_nom}`,
              }))
            : undefined;
        return {
          id: chId,
          label: `Chapitre ${ch.chapitre} : ${ch.chapitre_nom}`,
          children: sChildren,
          articles: articles.length > 0 ? articles : undefined,
        };
      });
      return {
        id: titreId,
        label: `Titre ${titre.titre} — ${titre.titre_nom}`,
        children: chChildren,
      };
    } else {
      // Titre sans chapitres : attacher les articles directement
      const keys = TRAVAIL_TITRE_MAP[titre.titre] || [];
      const articles = keys.flatMap((k) => loadArticles(k));
      return {
        id: titreId,
        label: `Titre ${titre.titre} — ${titre.titre_nom}`,
        articles: articles.length > 0 ? articles : undefined,
      };
    }
  });
  return { id: "social-code-travail", label: "1.1 Code du travail", children };
}

function buildPartieNode(id: string, label: string, items: { key: string; label: string }[]): SommaireNode {
  const children: SommaireNode[] = items.map((item) => {
    const articles = loadArticles(item.key);
    return {
      id: `${id}-${item.key}`,
      label: item.label,
      articles: articles.length > 0 ? articles : undefined,
    };
  });
  return { id, label, children };
}

function ensureSocialLoaded() {
  if (_socialSommaire) return;

  // --- Livre 1 : Droit du travail ---
  const codeTravailNode = buildCodeTravailNode();

  const textesAppNode = buildPartieNode("social-app", "1.2 Textes d'application", [
    { key: "app-art39-lic", label: "Licenciement (Art. 39)" },
    { key: "app-art39-com", label: "Commission des litiges (Art. 39)" },
    { key: "app-art83", label: "SMIG (Art. 83)" },
    { key: "app-art105-duree", label: "Durée du travail et heures sup (Art. 105)" },
    { key: "app-art105-derog", label: "Dérogations durée du travail (Art. 105)" },
    { key: "app-art105-hor", label: "Horaires services publics (Art. 105)" },
    { key: "app-art135", label: "Machines dangereuses (Art. 135)" },
    { key: "app-art137-com", label: "Comités hygiène et sécurité (Art. 137)" },
    { key: "app-art137-mes", label: "Mesures hygiène et sécurité (Art. 137)" },
  ]);

  const textesNonCodNode = buildPartieNode("social-tnc", "1.3 Textes non codifiés", [
    { key: "onemo", label: "1.3.1 Loi ONEMO (1988-22)" },
    { key: "acpe", label: "1.3.2 ACPE (Loi 2019-7)" },
    { key: "jours-feries", label: "1.3.3 Jours fériés (Loi 1994-02)" },
    { key: "journee-rep", label: "1.3.4 Journée de la République (Loi 2010-18)" },
    { key: "fete-nat", label: "1.3.5 Fête nationale (Loi 2010-19)" },
    { key: "fonea", label: "1.3.6 FONEA (Loi 2019-8)" },
    { key: "ints", label: "1.3.7 INTS (Loi 2015-06)" },
    { key: "saisie-arret", label: "1.3.8 Saisie-arrêt salaires (Décret 1984-209)" },
    { key: "perso-dom", label: "1.3.9 Personnel domestique (Arrêté 1868)" },
  ]);

  const oitNode = buildPartieNode("social-oit", "1.4 Conventions OIT", [
    { key: "oit", label: "Conventions de l'OIT applicables au Congo" },
  ]);

  const livre1: SommaireNode = {
    id: "social-livre1",
    label: "Livre 1 — Droit du travail",
    children: [codeTravailNode, textesAppNode, textesNonCodNode, oitNode],
  };

  // --- Livre 2 : Droit de la sécurité sociale ---
  const cssNode = buildPartieNode("social-css", "2.1 Code de la sécurité sociale (Loi 004-86)", [
    { key: "css-general", label: "Dispositions générales, Organisation, Ressources (Art. 1-34)" },
    { key: "css-famille", label: "Prestations familiales et de maternité (Art. 38-58)" },
    { key: "css-risques", label: "Risques professionnels (Art. 59-108)" },
    { key: "css-risques2", label: "Risques professionnels - suite (Art. 123-143)" },
    { key: "css-pensions", label: "Pensions vieillesse, invalidité (Art. 144-147)" },
    { key: "css-pensions2", label: "Pensions suite, Dispositions communes (Art. 148-168)" },
    { key: "css-contentieux", label: "Contentieux, Pénalités, Dispositions finales (Art. 169-198)" },
  ]);

  const tncSecuNode = buildPartieNode("social-tnc-secu", "2.2 Textes non codifiés de sécurité sociale", [
    { key: "age-retraite", label: "2.2.1 Âge de retraite (Loi 48-2024)" },
    { key: "sys-secu", label: "2.2.2 Système de sécurité sociale (Loi 2011-31)" },
    { key: "loi2012-p1", label: "2.2.3 Risques pro et pensions Art. 1-46 (Loi 2012-18)" },
    { key: "loi2012-p2", label: "2.2.3 Risques pro et pensions Art. 47+ (Loi 2012-18)" },
    { key: "dissolution-cnss", label: "2.2.4 Dissolution CNSS (Loi 10-2014)" },
    { key: "caisse-risques", label: "2.2.5 Caisse risques professionnels (Loi 11-2014)" },
    { key: "caisse-famille", label: "2.2.6 Caisse famille et enfance (Loi 12-2014)" },
    { key: "camu-loi", label: "2.2.7 CAMU (Loi 19-2023)" },
    { key: "camu-statuts", label: "2.2.8 Statuts CAMU (Décret 2023-1761)" },
    { key: "camu-cotis", label: "2.2.9 Cotisations CAMU (Décret 2024-131)" },
    { key: "camu-taux", label: "2.2.10 Taux cotisations CAMU (Décret 2024-133)" },
    { key: "tipl", label: "2.2.11 Assiette cotisations TIPL (Arrêté 31253)" },
  ]);

  const convSecuNode = buildPartieNode("social-conv-secu", "2.3 Conventions de sécurité sociale", [
    { key: "conv-france", label: "2.3.1 Convention France-Congo" },
    { key: "conv-cipres", label: "2.3.2 Convention CIPRES" },
  ]);

  const livre2: SommaireNode = {
    id: "social-livre2",
    label: "Livre 2 — Droit de la sécurité sociale",
    children: [cssNode, tncSecuNode, convSecuNode],
  };

  // --- Livre 3 : Conventions collectives ---
  const ccNode = buildPartieNode("social-cc", "3.1 Conventions collectives sectorielles", [
    { key: "cc-agri", label: "Agriculture et Forêt" },
    { key: "cc-aerien", label: "Aérien" },
    { key: "cc-aux-transp", label: "Auxiliaires de transport" },
    { key: "cc-bam", label: "Banques et assurances (BAM)" },
    { key: "cc-btp", label: "BTP" },
    { key: "cc-commerce", label: "Commerce" },
    { key: "cc-mines", label: "Exploitation minière" },
    { key: "cc-foret", label: "Forestière" },
    { key: "cc-hotel", label: "Hôtellerie et restauration" },
    { key: "cc-industrie", label: "Industrie" },
    { key: "cc-info", label: "Information et communication" },
    { key: "cc-ntic", label: "NTIC" },
    { key: "cc-parapetro", label: "Para-pétrole" },
    { key: "cc-peche", label: "Pêche maritime" },
    { key: "cc-domestique", label: "Personnel domestique" },
    { key: "cc-petrole", label: "Pétrole" },
  ]);

  const livre3: SommaireNode = {
    id: "social-livre3",
    label: "Livre 3 — Conventions collectives",
    children: [ccNode],
  };

  // --- Assemblage final ---
  _socialSommaire = [livre1, livre2, livre3];

  // --- Collecte de tous les articles ---
  const allKeys = Object.keys(FILE_MAP);
  _socialArticles = allKeys.flatMap((key) => loadArticles(key));
}

// --- API publique (même interface que cgi.ts) ---

export function getSocialSommaire(): SommaireNode[] {
  ensureSocialLoaded();
  return _socialSommaire!;
}

export function getAllSocialArticles(): ArticleData[] {
  ensureSocialLoaded();
  return _socialArticles!;
}

export function searchSocialArticles(query: string): SearchResult[] {
  ensureSocialLoaded();
  const q = normalize(query.trim());
  if (!q) return [];

  const words = q.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return [];

  const scored: SearchResult[] = [];

  for (const art of _socialArticles!) {
    const st = art._searchText || "";
    let allMatched = true;

    for (const w of words) {
      if (!st.includes(w)) {
        allMatched = false;
        break;
      }
    }
    if (!allMatched) continue;

    let score = 0;
    const artNum = normalize(art.article);
    if (artNum === q || artNum === "art. " + q) score += 200;
    else if (artNum.includes(q)) score += 80;

    const titreN = normalize(art.titre);
    for (const w of words) {
      if (titreN.includes(w)) score += 25;
    }

    if (words.length > 1 && st.includes(q)) score += 20;

    scored.push({ art, score, matchedWords: words });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}
