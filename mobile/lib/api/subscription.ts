import { api } from "./client";

export interface QuotaResponse {
  plan: string;
  creditsUsed: number;
  creditsPerMonth: number;
  creditsTotal: number;
  creditsPurchased: number;
  remaining: number;
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
  status: string;
}

export interface SubscriptionDetail {
  id: string;
  plan: string;
  status: string;
  startDate: string;
  endDate: string | null;
  autoRenew: boolean;
  questionsPerMonth: number;
  isUnlimited: boolean;
}

export const subscriptionApi = {
  getQuota: async (): Promise<QuotaResponse> => {
    const { data } = await api.get<QuotaResponse>("/subscription/quota");
    return data;
  },

  getSubscription: async (): Promise<SubscriptionDetail> => {
    const { data } = await api.get<SubscriptionDetail>("/subscription");
    return data;
  },

  activate: async (plan: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>("/subscription/activate", { plan });
    return data;
  },

  renew: async (): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>("/subscription/renew");
    return data;
  },

  upgrade: async (plan: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>("/subscription/upgrade", { plan });
    return data;
  },
};
