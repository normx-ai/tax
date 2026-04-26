import { z } from "zod";

const STATUT = z.enum(["A_FAIRE", "EN_COURS", "PRET", "DEPOSE", "PAYE", "EN_RETARD", "NON_APPLICABLE"]);

export const updateDossierBody = z.object({
  statut: STATUT.optional(),
  montantCalcule: z.number().nullable().optional(),
  baseImposable: z.number().nullable().optional(),
  dateDepot: z.string().datetime().nullable().optional(),
  datePaiement: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const listDossiersQuery = z.object({
  entiteId: z.string().uuid().optional(),
  statut: STATUT.optional(),
  obligationCode: z.string().optional(),
  dateMin: z.coerce.date().optional(),
  dateMax: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

export const recalculerDossiersBody = z.object({
  entiteId: z.string().uuid().optional(),  // Si absent, recalcul pour toutes les entites de l'org
  anneeFiscale: z.number().int().min(2020).max(2050).optional(),
});

export type UpdateDossierBody = z.infer<typeof updateDossierBody>;
export type ListDossiersQuery = z.infer<typeof listDossiersQuery>;
