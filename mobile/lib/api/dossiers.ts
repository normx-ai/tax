import { api } from "./client";

export type DossierStatut = "A_FAIRE" | "EN_COURS" | "PRET" | "DEPOSE" | "PAYE" | "EN_RETARD" | "NON_APPLICABLE";

export interface DashboardKpis {
  totalClients: number;
  obligationsEnRetard: number;
  obligationsDuMois: number;
  obligationsDeposeesDuMois: number;
  completionPct: number;
}

export interface DossierObligationRef {
  id: string;
  code: string;
  libelle: string;
  categorie: string;
  periodicite: string;
  simulateurCode?: string | null;
}

export interface DossierEntiteRef {
  id: string;
  raisonSociale: string;
  sigle?: string | null;
}

export interface Dossier {
  id: string;
  entiteId: string;
  obligationId: string;
  periode: string;
  dateEcheance: string;
  statut: DossierStatut;
  montantCalcule?: string | null;
  baseImposable?: string | null;
  dateDepot?: string | null;
  datePaiement?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  entite?: DossierEntiteRef;
  obligation?: DossierObligationRef;
}

export interface ListDossiersResult {
  items: Dossier[];
  total: number;
  page: number;
  limit: number;
}

export interface ListDossiersFilters {
  entiteId?: string;
  statut?: DossierStatut;
  obligationCode?: string;
  dateMin?: string;
  dateMax?: string;
  page?: number;
  limit?: number;
}

export interface UpdateDossierInput {
  statut?: DossierStatut;
  montantCalcule?: number | null;
  baseImposable?: number | null;
  dateDepot?: string | null;
  datePaiement?: string | null;
  notes?: string | null;
}

export interface RecalculerInput {
  entiteId?: string;
  anneeFiscale?: number;
}

export interface RecalculerResult {
  entitesTraitees?: number;
  entiteId?: string;
  obligationsApplicables?: number;
  dossiersTraites?: number;
  dossiersDevenusNonApplicables?: number;
}

export const dossiersApi = {
  list: async (filters: ListDossiersFilters = {}): Promise<ListDossiersResult> => {
    const { data } = await api.get<ListDossiersResult>("/dossiers", { params: filters });
    return data;
  },

  getKpis: async (anneeFiscale?: number): Promise<DashboardKpis> => {
    const { data } = await api.get<DashboardKpis>("/dossiers/kpis", { params: anneeFiscale ? { anneeFiscale } : {} });
    return data;
  },

  getById: async (id: string): Promise<Dossier> => {
    const { data } = await api.get<Dossier>(`/dossiers/${id}`);
    return data;
  },

  update: async (id: string, input: UpdateDossierInput): Promise<Dossier> => {
    const { data } = await api.patch<Dossier>(`/dossiers/${id}`, input);
    return data;
  },

  recalculer: async (input: RecalculerInput = {}): Promise<RecalculerResult> => {
    const { data } = await api.post<RecalculerResult>("/dossiers/recalculer", input);
    return data;
  },
};

export const STATUT_LABELS: Record<DossierStatut, string> = {
  A_FAIRE: "À faire",
  EN_COURS: "En cours",
  PRET: "Prêt à déposer",
  DEPOSE: "Déposé",
  PAYE: "Payé",
  EN_RETARD: "En retard",
  NON_APPLICABLE: "Non applicable",
};

export const STATUT_COULEURS: Record<DossierStatut, string> = {
  A_FAIRE: "#9ca3af",
  EN_COURS: "#3b82f6",
  PRET: "#D4A843",
  DEPOSE: "#22c55e",
  PAYE: "#0F2A42",
  EN_RETARD: "#ef4444",
  NON_APPLICABLE: "#d1d5db",
};
