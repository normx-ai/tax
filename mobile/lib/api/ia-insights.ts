import { api } from "./client";

export type InsightType = "optimisation" | "echeance" | "anomalie" | "info";

export interface Insight {
  type: InsightType;
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

export const iaInsightsApi = {
  get: async (force = false): Promise<InsightsResult> => {
    const { data } = await api.get<InsightsResult>("/ia-insights", { params: force ? { force: true } : {} });
    return data;
  },

  refresh: async (): Promise<InsightsResult> => {
    const { data } = await api.post<InsightsResult>("/ia-insights/refresh");
    return data;
  },
};
