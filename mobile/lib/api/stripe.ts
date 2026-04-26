import { api } from "./client";

export type StripeBillingPeriod = "monthly" | "yearly";

interface CheckoutResponse {
  url: string;
  sessionId: string;
}

export const stripeApi = {
  createCheckoutSession: async (
    plan: "PRO",
    period: StripeBillingPeriod,
  ): Promise<CheckoutResponse> => {
    const { data } = await api.post<CheckoutResponse>("/stripe/checkout", { plan, period });
    return data;
  },
};
