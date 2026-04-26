import { api } from "./client";

export type SecteurActivite =
  | "AERIEN" | "AGRI_FORET" | "AUXILIAIRES_TRANSPORT" | "BAM" | "BTP"
  | "COMMERCE" | "EXPLOITATION_MINIERE" | "FORESTIERE" | "HOTELLERIE_CATERING"
  | "INDUSTRIE" | "INFORMATION_COMMUNICATION" | "NTIC" | "PARA_PETROLE"
  | "PECHE_MARITIME" | "PERSONNEL_DOMESTIQUE" | "PETROLE";

export type FormeJuridique =
  | "EI" | "SARL" | "SARLU" | "SA" | "SAS" | "SASU"
  | "SNC" | "SCS" | "SOCIETE_PARTICIPATION" | "GIE"
  | "SCI" | "ASSOCIATION" | "AUTRE";

export type RegimeIS = "REEL_NORMAL" | "REEL_SIMPLIFIE" | "MICRO" | "EXONERE";
export type RegimeTVA = "REEL" | "FRANCHISE" | "EXONERE" | "NON_ASSUJETTI";

export interface Entite {
  id: string;
  organizationId: string;
  raisonSociale: string;
  sigle?: string | null;
  niu?: string | null;
  rccm?: string | null;
  adresse?: string | null;
  ville?: string | null;
  telephone?: string | null;
  email?: string | null;
  formeJuridique: FormeJuridique;
  secteurActivite: SecteurActivite;
  regimeIs: RegimeIS;
  regimeTva: RegimeTVA;
  estEmployeur: boolean;
  effectifSalaries: number;
  possedeFoncierBati: boolean;
  possedeFoncierNonBati: boolean;
  caEstimeAnneeCourante?: string | null;
  caRealiseAnneeN1?: string | null;
  dateCreation?: string | null;
  dateClotureExercice?: string | null;
  isClientSelf: boolean;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListEntitesResult {
  items: Entite[];
  total: number;
  page: number;
  limit: number;
}

export interface ListEntitesFilters {
  secteurActivite?: SecteurActivite;
  actif?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export type CreateEntitePayload = Omit<Entite, "id" | "organizationId" | "createdAt" | "updatedAt">;
export type UpdateEntitePayload = Partial<Omit<CreateEntitePayload, "isClientSelf">>;

export const entitesApi = {
  list: async (filters: ListEntitesFilters = {}): Promise<ListEntitesResult> => {
    const { data } = await api.get<ListEntitesResult>("/entites", { params: filters });
    return data;
  },

  getSelf: async (): Promise<Entite | null> => {
    try {
      const { data } = await api.get<Entite>("/entites/self");
      return data;
    } catch (err) {
      // 404 = pas encore d'entite self -> renvoie null
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 404) return null;
      throw err;
    }
  },

  getById: async (id: string): Promise<Entite> => {
    const { data } = await api.get<Entite>(`/entites/${id}`);
    return data;
  },

  create: async (input: CreateEntitePayload): Promise<Entite> => {
    const { data } = await api.post<Entite>("/entites", input);
    return data;
  },

  update: async (id: string, input: UpdateEntitePayload): Promise<Entite> => {
    const { data } = await api.patch<Entite>(`/entites/${id}`, input);
    return data;
  },

  desactiver: async (id: string): Promise<Entite> => {
    const { data } = await api.post<Entite>(`/entites/${id}/desactiver`);
    return data;
  },

  activer: async (id: string): Promise<Entite> => {
    const { data } = await api.post<Entite>(`/entites/${id}/activer`);
    return data;
  },
};

// === Helpers UI ===

export const SECTEUR_LABELS: Record<SecteurActivite, string> = {
  AERIEN: "Aérien",
  AGRI_FORET: "Agriculture / Forêt",
  AUXILIAIRES_TRANSPORT: "Auxiliaires transport",
  BAM: "Banques / Assurances / Mutuelles",
  BTP: "Bâtiment et Travaux Publics",
  COMMERCE: "Commerce",
  EXPLOITATION_MINIERE: "Exploitation minière",
  FORESTIERE: "Forestière",
  HOTELLERIE_CATERING: "Hôtellerie / Restauration (HCR)",
  INDUSTRIE: "Industrie",
  INFORMATION_COMMUNICATION: "Information et communication",
  NTIC: "NTIC",
  PARA_PETROLE: "Para-pétrole",
  PECHE_MARITIME: "Pêche maritime",
  PERSONNEL_DOMESTIQUE: "Personnel domestique",
  PETROLE: "Pétrole",
};

export const FORME_JURIDIQUE_LABELS: Record<FormeJuridique, string> = {
  EI: "Entreprise individuelle",
  SARL: "SARL",
  SARLU: "SARL unipersonnelle",
  SA: "SA",
  SAS: "SAS",
  SASU: "SASU",
  SNC: "SNC (en nom collectif)",
  SCS: "SCS (commandite simple)",
  SOCIETE_PARTICIPATION: "Société en participation",
  GIE: "GIE",
  SCI: "SCI",
  ASSOCIATION: "Association",
  AUTRE: "Autre",
};

export const REGIME_IS_LABELS: Record<RegimeIS, string> = {
  REEL_NORMAL: "Réel normal",
  REEL_SIMPLIFIE: "Réel simplifié",
  MICRO: "Micro",
  EXONERE: "Exonéré",
};

export const REGIME_TVA_LABELS: Record<RegimeTVA, string> = {
  REEL: "Assujetti — réel",
  FRANCHISE: "En franchise (sous le seuil)",
  EXONERE: "Exonéré",
  NON_ASSUJETTI: "Non assujetti",
};
