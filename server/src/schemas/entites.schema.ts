import { z } from "zod";

const SECTEUR = z.enum([
  "AERIEN",
  "AGRI_FORET",
  "AUXILIAIRES_TRANSPORT",
  "BAM",
  "BTP",
  "COMMERCE",
  "EXPLOITATION_MINIERE",
  "FORESTIERE",
  "HOTELLERIE_CATERING",
  "INDUSTRIE",
  "INFORMATION_COMMUNICATION",
  "NTIC",
  "PARA_PETROLE",
  "PECHE_MARITIME",
  "PERSONNEL_DOMESTIQUE",
  "PETROLE",
]);

const FORME_JURIDIQUE = z.enum([
  "EI", "SARL", "SARLU", "SA", "SAS", "SASU", "GIE", "ASSOCIATION", "SCI", "AUTRE",
]);

const REGIME_IS = z.enum(["REEL_NORMAL", "REEL_SIMPLIFIE", "MICRO", "EXONERE"]);

const REGIME_TVA = z.enum(["REEL", "FRANCHISE", "EXONERE", "NON_ASSUJETTI"]);

const baseFields = {
  raisonSociale: z.string().min(1).max(200),
  sigle: z.string().max(50).optional(),
  niu: z.string().max(50).optional(),
  rccm: z.string().max(50).optional(),
  adresse: z.string().max(500).optional(),
  ville: z.string().max(100).optional(),
  telephone: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal("")),
  formeJuridique: FORME_JURIDIQUE,
  secteurActivite: SECTEUR,
  regimeIs: REGIME_IS,
  regimeTva: REGIME_TVA,
  estEmployeur: z.boolean().default(false),
  effectifSalaries: z.number().int().min(0).default(0),
  possedeFoncierBati: z.boolean().default(false),
  possedeFoncierNonBati: z.boolean().default(false),
  caEstimeAnneeCourante: z.number().nonnegative().optional(),
  caRealiseAnneeN1: z.number().nonnegative().optional(),
  dateCreation: z.string().datetime().optional(),
  dateClotureExercice: z.string().regex(/^\d{2}-\d{2}$/).optional(),
  isClientSelf: z.boolean().default(false),
  actif: z.boolean().default(true),
};

export const createEntite = z.object(baseFields);

export const updateEntite = z.object({
  raisonSociale: baseFields.raisonSociale.optional(),
  sigle: baseFields.sigle,
  niu: baseFields.niu,
  rccm: baseFields.rccm,
  adresse: baseFields.adresse,
  ville: baseFields.ville,
  telephone: baseFields.telephone,
  email: baseFields.email,
  formeJuridique: baseFields.formeJuridique.optional(),
  secteurActivite: baseFields.secteurActivite.optional(),
  regimeIs: baseFields.regimeIs.optional(),
  regimeTva: baseFields.regimeTva.optional(),
  estEmployeur: baseFields.estEmployeur.optional(),
  effectifSalaries: baseFields.effectifSalaries.optional(),
  possedeFoncierBati: baseFields.possedeFoncierBati.optional(),
  possedeFoncierNonBati: baseFields.possedeFoncierNonBati.optional(),
  caEstimeAnneeCourante: baseFields.caEstimeAnneeCourante,
  caRealiseAnneeN1: baseFields.caRealiseAnneeN1,
  dateCreation: baseFields.dateCreation,
  dateClotureExercice: baseFields.dateClotureExercice,
  actif: baseFields.actif.optional(),
});

export const listEntitesQuery = z.object({
  secteurActivite: SECTEUR.optional(),
  actif: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type CreateEntiteInput = z.infer<typeof createEntite>;
export type UpdateEntiteInput = z.infer<typeof updateEntite>;
export type ListEntitesQuery = z.infer<typeof listEntitesQuery>;
