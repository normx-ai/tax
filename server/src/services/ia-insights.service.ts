// Bloc 5.1 — IA Insights contextuelles pour le dashboard fiscal.
//
// Genere des suggestions personnalisees pour une organisation a partir :
// - du profil de ses entites (regime fiscal, secteur, foncier...)
// - de l'etat de ses dossiers (en retard, a venir, deposes)
// - du catalogue d'obligations applicables
//
// Les suggestions sont retournees structurees pour etre affichees dans
// la card "IA Insights" du dashboard. Cache en memoire 1 heure pour
// limiter le cout API Claude.

import Anthropic from "@anthropic-ai/sdk";
import prisma from "../utils/prisma";
import { createLogger } from "../utils/logger";

const logger = createLogger("IAInsights");
const CLAUDE_MODEL = "claude-sonnet-4-6";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1h

const anthropic = new Anthropic();

interface InsightCache {
  insights: Insight[];
  generatedAt: number;
}
const cache = new Map<string, InsightCache>();

export interface Insight {
  type: "optimisation" | "echeance" | "anomalie" | "info";
  titre: string;
  description: string;
  economiePotentielleFcfa?: number;
  entiteIds?: string[];
}

export interface InsightsResult {
  insights: Insight[];
  generatedAt: string;
  cached: boolean;
}

/**
 * Recupere les insights IA pour une organisation. Cache 1h, regeneration
 * forcee possible.
 */
export async function getInsightsForOrg(orgId: string, force = false): Promise<InsightsResult> {
  const cached = cache.get(orgId);
  if (!force && cached && Date.now() - cached.generatedAt < CACHE_TTL_MS) {
    return {
      insights: cached.insights,
      generatedAt: new Date(cached.generatedAt).toISOString(),
      cached: true,
    };
  }

  const insights = await genererInsights(orgId);
  cache.set(orgId, { insights, generatedAt: Date.now() });
  return {
    insights,
    generatedAt: new Date().toISOString(),
    cached: false,
  };
}

/**
 * Effectue la generation effective via Claude. Si l'org n'a aucune
 * donnee (pas d'entites, pas de dossiers), renvoie une suggestion
 * d'onboarding.
 */
async function genererInsights(orgId: string): Promise<Insight[]> {
  const [entites, dossiersEnRetard, dossiersAVenir] = await Promise.all([
    prisma.entite.findMany({
      where: { organizationId: orgId, actif: true },
      select: {
        id: true, raisonSociale: true, secteurActivite: true,
        regimeIs: true, regimeTva: true, formeJuridique: true,
        estEmployeur: true, effectifSalaries: true,
        possedeFoncierBati: true, possedeFoncierNonBati: true,
        caEstimeAnneeCourante: true, caRealiseAnneeN1: true,
      },
    }),
    prisma.dossier.findMany({
      where: {
        entite: { organizationId: orgId, actif: true },
        statut: "EN_RETARD",
      },
      include: {
        entite: { select: { raisonSociale: true } },
        obligation: { select: { code: true, libelle: true } },
      },
      take: 20,
    }),
    prisma.dossier.findMany({
      where: {
        entite: { organizationId: orgId, actif: true },
        statut: { in: ["A_FAIRE", "EN_COURS"] },
        dateEcheance: { lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) }, // 14 jours
      },
      include: {
        entite: { select: { raisonSociale: true } },
        obligation: { select: { code: true, libelle: true } },
      },
      take: 30,
    }),
  ]);

  // Cas onboarding : aucune donnee a analyser
  if (entites.length === 0) {
    return [{
      type: "info",
      titre: "Configurez vos entités",
      description: "Créez vos entités fiscales (cabinet : vos clients ; entreprise : la vôtre) pour activer le suivi automatique des obligations et obtenir des suggestions personnalisées.",
    }];
  }

  // Construire le contexte pour Claude
  const contexte = {
    nb_entites: entites.length,
    entites: entites.map(e => ({
      id: e.id,
      raisonSociale: e.raisonSociale,
      secteur: e.secteurActivite,
      regimeIs: e.regimeIs,
      regimeTva: e.regimeTva,
      formeJuridique: e.formeJuridique,
      employeur: e.estEmployeur,
      salaries: e.effectifSalaries,
      foncierBati: e.possedeFoncierBati,
      foncierNonBati: e.possedeFoncierNonBati,
      ca_n_moins_1: e.caRealiseAnneeN1 ? Number(e.caRealiseAnneeN1) : null,
      ca_n_estime: e.caEstimeAnneeCourante ? Number(e.caEstimeAnneeCourante) : null,
    })),
    dossiers_en_retard: dossiersEnRetard.map(d => ({
      entite: d.entite?.raisonSociale,
      code: d.obligation?.code,
      libelle: d.obligation?.libelle,
      periode: d.periode,
      echeance: d.dateEcheance.toISOString().slice(0, 10),
    })),
    dossiers_a_venir: dossiersAVenir.map(d => ({
      entite: d.entite?.raisonSociale,
      code: d.obligation?.code,
      libelle: d.obligation?.libelle,
      periode: d.periode,
      echeance: d.dateEcheance.toISOString().slice(0, 10),
    })),
  };

  const prompt = `Tu es un expert fiscaliste de la République du Congo (Brazzaville). Tu analyses la situation fiscale d'une organisation et tu produis 1 à 3 suggestions actionnables.

Contexte fiscal de l'organisation :
${JSON.stringify(contexte, null, 2)}

Référentiel à utiliser :
- Régime PME au Congo : seuils de chiffre d'affaires < 100M FCFA (Réel Simplifié) ou < 60M FCFA (Micro), permettent des taux IS réduits.
- Échéances clés (Art. 461 bis : tout est fixé au 15 du mois, sauf août au 20) : ITS/TUS/TVA le 15 du mois suivant ; déclaration IS annuelle + dépôt des états financiers le 15 mai (pour exercice clos au 31/12, Art. 86-F + Art. 461 bis) ; Patente du 1er au 20 avril (Art. 310). AUCUNE échéance n'est fixée au 30 du mois — toute date au 30 est nulle de nul effet.
- Pénalités : 5%/mois de retard sur la TVA, intérêts de retard 1,5%/mois sur l'IS.

Réponds en JSON strict avec ce format :
[
  {
    "type": "optimisation" | "echeance" | "anomalie" | "info",
    "titre": "Titre court de la suggestion (max 80 caractères)",
    "description": "Description précise et actionnable, 1 à 3 phrases. Cite les entités concernées par leur raison sociale si pertinent.",
    "economiePotentielleFcfa": <nombre optionnel, en FCFA>,
    "entiteIds": [<ids optionnels des entités concernées>]
  }
]

Règles :
- Maximum 3 insights, prioriser les retards et les optimisations chiffrables.
- Pas d'invention : ne suggère que ce que les données du contexte permettent de déduire.
- Si rien d'urgent ni d'optimisable, propose 1 insight de type "info" general.
- Pas de markdown, pas de texte avant ou après le JSON.`;

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });
    const block = response.content[0];
    if (!block || block.type !== "text") {
      logger.warn("Réponse Claude vide ou non textuelle");
      return [];
    }
    const text = block.text.trim();
    // Le modele peut entourer le JSON de ```json ... ``` malgre la consigne
    const jsonText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(jsonText) as Insight[];
    return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
  } catch (err) {
    logger.error("Echec generation insights", err as Error);
    return [];
  }
}

export function invalidateCache(orgId: string): void {
  cache.delete(orgId);
}
