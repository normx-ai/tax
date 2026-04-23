import { api } from "./client";

export type DocumentType = "facture" | "contrat";

export const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  facture: "Facture",
  contrat: "Contrat",
};

export type AuditAxe = "langue" | "tva" | "mentions" | "risques" | "recommandations";

export const ALL_AXES: AuditAxe[] = ["langue", "tva", "mentions", "risques", "recommandations"];

export const AXE_LABELS: Record<AuditAxe, string> = {
  langue: "Langue",
  tva: "Taux TVA",
  mentions: "Mentions obligatoires",
  risques: "Risques",
  recommandations: "Recommandations",
};

export interface MentionResult {
  nom: string;
  present: boolean;
  valeur: string | null;
}

export interface AuditFactureResult {
  typeDocument: DocumentType;
  score: { found: number; total: number };
  langue: { conforme: boolean; details: string };
  tva: {
    assujetti: boolean;
    conforme: boolean;
    tauxApplique: string | null;
    tauxAttendu: string | null;
    details: string;
  };
  mentions: MentionResult[];
  risques: { type: string; description: string; montant?: string }[];
  recommandations: string[];
  donneesExtraites: Record<string, string>;
}

export interface AuditHistoryItem {
  id: string;
  fileName: string;
  docType: DocumentType;
  score: number;
  total: number;
  conforme: boolean;
  createdAt: string;
}

export async function getAuditHistory(): Promise<AuditHistoryItem[]> {
  const { data } = await api.get<AuditHistoryItem[]>("/audit-facture/history");
  return data;
}

export async function getAuditDetail(id: string): Promise<AuditFactureResult> {
  const { data } = await api.get(`/audit-facture/${id}`);
  return data.result;
}

export async function analyzeDocument(
  file: Blob,
  filename: string,
  type: DocumentType = "facture",
  axes?: AuditAxe[],
  signal?: AbortSignal,
): Promise<AuditFactureResult> {
  const formData = new FormData();
  formData.append("file", file, filename);
  formData.append("type", type);
  if (axes && axes.length > 0 && axes.length < ALL_AXES.length) {
    formData.append("axes", axes.join(","));
  }
  const { data } = await api.post<AuditFactureResult>("/audit-facture", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60_000,
    signal,
  });
  return data;
}
