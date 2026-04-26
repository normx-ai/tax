import { z } from 'zod';

// Periodicites supportees (aligne avec enum Prisma ObligationPeriodicite)
const PERIODICITE = z.enum([
  'MENSUELLE',
  'BIMENSUELLE',
  'TRIMESTRIELLE',
  'SEMESTRIELLE',
  'ANNUELLE',
  'PONCTUELLE',
]);

// Categories du CGI Congo (aligne avec enum Prisma AlerteCategorie)
const CATEGORIE = z.enum([
  'IS', 'PM_ETRANGERES', 'MINIMUM_PERCEPTION', 'PRIX_TRANSFERT',
  'IBA', 'IRCM', 'IRF', 'ITS',
  'DECLARATIONS', 'VERIFICATION',
  'TAXE_TERRAINS', 'TAXE_VEHICULES',
  'FONCIER_BATI', 'FONCIER_NON_BATI', 'PATENTE',
  'TAXE_REGIONALE', 'TAXE_SPECTACLES', 'TAXES_FACULTATIVES',
  'SANCTIONS', 'RECOUVREMENT', 'RECLAMATIONS',
  'TVA',
]);

// Format de la regle d'echeance — JSON validation legere
// Discriminated union sur "type" pour avoir des types stricts.
const echeanceRule = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('monthly'),
    day: z.union([z.number().int().min(1).max(31), z.literal('last')]),
  }),
  z.object({
    type: z.literal('yearly'),
    month: z.number().int().min(1).max(12),
    day: z.union([z.number().int().min(1).max(31), z.literal('last')]),
  }),
  z.object({
    type: z.literal('quarterly'),
    months: z.array(z.number().int().min(1).max(12)).min(1).max(4),
    day: z.union([z.number().int().min(1).max(31), z.literal('last')]),
  }),
  z.object({
    type: z.literal('semestriel'),
    months: z.array(z.number().int().min(1).max(12)).length(2),
    day: z.union([z.number().int().min(1).max(31), z.literal('last')]),
  }),
  z.object({
    type: z.literal('ponctuelle'),
    description: z.string(),
  }),
]);

// Regles d'applicabilite : JSON libre, validation cote moteur. On accepte
// n'importe quelle structure d'objet ici — la coherence semantique est
// verifiee par le moteur de calendrier.
const applicabilite = z.record(z.string(), z.unknown()).default({});

const baseObligationFields = {
  code: z.string().min(1).max(50),
  libelle: z.string().min(1).max(200),
  description: z.string().optional(),
  categorie: CATEGORIE,
  periodicite: PERIODICITE,
  echeanceRule,
  applicabilite,
  articleNumero: z.string().optional(),
  articleId: z.string().uuid().optional(),
  simulateurCode: z.string().optional(),
  version: z.string().default('2026'),
  actif: z.boolean().default(true),
  ordre: z.number().int().default(100),
};

export const createObligation = z.object(baseObligationFields);
export const updateObligation = z.object({
  code: baseObligationFields.code.optional(),
  libelle: baseObligationFields.libelle.optional(),
  description: baseObligationFields.description,
  categorie: baseObligationFields.categorie.optional(),
  periodicite: baseObligationFields.periodicite.optional(),
  echeanceRule: baseObligationFields.echeanceRule.optional(),
  applicabilite: baseObligationFields.applicabilite,
  articleNumero: baseObligationFields.articleNumero,
  articleId: baseObligationFields.articleId,
  simulateurCode: baseObligationFields.simulateurCode,
  version: baseObligationFields.version.optional(),
  actif: baseObligationFields.actif.optional(),
  ordre: baseObligationFields.ordre.optional(),
});

export const listObligationsQuery = z.object({
  version: z.string().optional(),
  categorie: CATEGORIE.optional(),
  periodicite: PERIODICITE.optional(),
  actif: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

export const cloneVersionBody = z.object({
  fromVersion: z.string(),
  toVersion: z.string(),
});

export type CreateObligationInput = z.infer<typeof createObligation>;
export type UpdateObligationInput = z.infer<typeof updateObligation>;
export type ListObligationsQuery = z.infer<typeof listObligationsQuery>;
