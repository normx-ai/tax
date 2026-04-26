import { api } from "./client";

// Types alignes avec les enums Prisma cote serveur

export type Periodicite =
  | "MENSUELLE"
  | "BIMENSUELLE"
  | "TRIMESTRIELLE"
  | "SEMESTRIELLE"
  | "ANNUELLE"
  | "PONCTUELLE";

export type Categorie =
  | "IS" | "PM_ETRANGERES" | "MINIMUM_PERCEPTION" | "PRIX_TRANSFERT"
  | "IBA" | "IRCM" | "IRF" | "ITS"
  | "DECLARATIONS" | "VERIFICATION"
  | "TAXE_TERRAINS" | "TAXE_VEHICULES"
  | "FONCIER_BATI" | "FONCIER_NON_BATI" | "PATENTE"
  | "TAXE_REGIONALE" | "TAXE_SPECTACLES" | "TAXES_FACULTATIVES"
  | "SANCTIONS" | "RECOUVREMENT" | "RECLAMATIONS"
  | "TVA";

export interface EcheanceMonthly { type: "monthly"; day: number | "last" }
export interface EcheanceYearly { type: "yearly"; month: number; day: number | "last" }
export interface EcheanceQuarterly { type: "quarterly"; months: number[]; day: number | "last" }
export interface EcheanceSemestriel { type: "semestriel"; months: number[]; day: number | "last" }
export interface EcheancePonctuelle { type: "ponctuelle"; description: string }
export type EcheanceRule =
  | EcheanceMonthly
  | EcheanceYearly
  | EcheanceQuarterly
  | EcheanceSemestriel
  | EcheancePonctuelle;

export interface ApplicabiliteRules {
  // JSON libre cote serveur, on tape les cles connues mais on accepte le reste
  [key: string]: unknown;
}

export interface ArticleRef {
  id: string;
  numero: string;
  titre: string;
  tome?: number;
  livre?: string;
}

export interface Obligation {
  id: string;
  code: string;
  libelle: string;
  description?: string | null;
  categorie: Categorie;
  periodicite: Periodicite;
  echeanceRule: EcheanceRule;
  applicabilite: ApplicabiliteRules;
  articleNumero?: string | null;
  articleId?: string | null;
  article?: ArticleRef | null;
  simulateurCode?: string | null;
  version: string;
  actif: boolean;
  ordre: number;
  createdAt: string;
  updatedAt: string;
}

export interface ObligationListResult {
  items: Obligation[];
  total: number;
  page: number;
  limit: number;
}

export interface ObligationFilters {
  version?: string;
  categorie?: Categorie;
  periodicite?: Periodicite;
  actif?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// AlerteFiscale extraite du CGI (donnee deja existante dans la plateforme)
export interface AlerteAide {
  id: string;
  type: string;
  categorie: Categorie;
  titre: string;
  description: string;
  valeur?: string | null;
  unite?: string | null;
  periodicite?: string | null;
  articleNumero: string;
}

export type AlertesAideGroupees = Record<string, AlerteAide[]>;

export const obligationsApi = {
  list: async (filters: ObligationFilters = {}): Promise<ObligationListResult> => {
    const { data } = await api.get<ObligationListResult>("/obligations", { params: filters });
    return data;
  },

  getById: async (id: string): Promise<Obligation> => {
    const { data } = await api.get<Obligation>(`/obligations/${id}`);
    return data;
  },

  create: async (input: Omit<Obligation, "id" | "createdAt" | "updatedAt" | "article">): Promise<Obligation> => {
    const { data } = await api.post<Obligation>("/obligations", input);
    return data;
  },

  update: async (id: string, input: Partial<Omit<Obligation, "id" | "createdAt" | "updatedAt" | "article">>): Promise<Obligation> => {
    const { data } = await api.patch<Obligation>(`/obligations/${id}`, input);
    return data;
  },

  desactiver: async (id: string): Promise<Obligation> => {
    const { data } = await api.post<Obligation>(`/obligations/${id}/desactiver`);
    return data;
  },

  activer: async (id: string): Promise<Obligation> => {
    const { data } = await api.post<Obligation>(`/obligations/${id}/activer`);
    return data;
  },

  clonerVersion: async (fromVersion: string, toVersion: string): Promise<{ cloned: number; message: string }> => {
    const { data } = await api.post<{ cloned: number; message: string }>("/obligations/cloner-version", { fromVersion, toVersion });
    return data;
  },

  getAlertesAide: async (): Promise<AlertesAideGroupees> => {
    const { data } = await api.get<AlertesAideGroupees>("/obligations/alertes-aide");
    return data;
  },

  searchArticles: async (q: string, version = "2026"): Promise<ArticleRef[]> => {
    const { data } = await api.get<ArticleRef[]>("/obligations/articles-recherche", { params: { q, version } });
    return data;
  },

  getSimulateurs: async (): Promise<string[]> => {
    const { data } = await api.get<string[]>("/obligations/simulateurs");
    return data;
  },
};

// === Helpers UI ===

export const PERIODICITE_LABELS: Record<Periodicite, string> = {
  MENSUELLE: "Mensuelle",
  BIMENSUELLE: "Bimensuelle",
  TRIMESTRIELLE: "Trimestrielle",
  SEMESTRIELLE: "Semestrielle",
  ANNUELLE: "Annuelle",
  PONCTUELLE: "Ponctuelle",
};

export const CATEGORIE_LABELS: Record<Categorie, string> = {
  IS: "Impôt sur les sociétés",
  PM_ETRANGERES: "PM étrangères",
  MINIMUM_PERCEPTION: "Minimum de perception",
  PRIX_TRANSFERT: "Prix de transfert",
  IBA: "IBA",
  IRCM: "IRCM",
  IRF: "IRF",
  ITS: "ITS",
  DECLARATIONS: "Déclarations",
  VERIFICATION: "Vérification",
  TAXE_TERRAINS: "Taxe terrains",
  TAXE_VEHICULES: "Taxe véhicules",
  FONCIER_BATI: "Foncier bâti (CFPB)",
  FONCIER_NON_BATI: "Foncier non bâti (CFPNB)",
  PATENTE: "Patente",
  TAXE_REGIONALE: "Taxe régionale",
  TAXE_SPECTACLES: "Taxe spectacles",
  TAXES_FACULTATIVES: "Taxes facultatives",
  SANCTIONS: "Sanctions",
  RECOUVREMENT: "Recouvrement",
  RECLAMATIONS: "Réclamations",
  TVA: "TVA",
};

export function formatEcheance(rule: EcheanceRule): string {
  const dayLabel = (d: number | "last") => d === "last" ? "dernier jour" : `${d}`;
  const moisFr = ["", "janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  switch (rule.type) {
    case "monthly":
      return `Le ${dayLabel(rule.day)} de chaque mois`;
    case "yearly":
      return `Le ${dayLabel(rule.day)} ${moisFr[rule.month] ?? ""}`;
    case "quarterly":
      return `Le ${dayLabel(rule.day)} de ${rule.months.map(m => moisFr[m]).filter(Boolean).join(", ")}`;
    case "semestriel":
      return `Le ${dayLabel(rule.day)} de ${rule.months.map(m => moisFr[m]).filter(Boolean).join(" et ")}`;
    case "ponctuelle":
      return rule.description;
    default:
      return "—";
  }
}
