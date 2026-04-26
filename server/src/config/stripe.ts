import Stripe from "stripe";
import { createLogger } from "../utils/logger";
import type { PlanName } from "../types/plans";

const logger = createLogger("StripeConfig");

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  logger.warn("STRIPE_SECRET_KEY non defini — l'integration Stripe est desactivee");
}

export const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" })
  : null;

export const isStripeEnabled = (): boolean => stripe !== null;

export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY ?? "";
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
export const STRIPE_SUCCESS_URL = process.env.STRIPE_SUCCESS_URL ?? "";
export const STRIPE_CANCEL_URL = process.env.STRIPE_CANCEL_URL ?? "";

export type BillingPeriod = "monthly" | "yearly";

interface PlanPriceMapping {
  monthly?: string;
  yearly?: string;
}

const PLAN_PRICES: Record<PlanName, PlanPriceMapping> = {
  FREE: {},
  PRO: {
    monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY,
    yearly: process.env.STRIPE_PRICE_ID_PRO_YEARLY,
  },
};

export function getStripePriceId(plan: PlanName, period: BillingPeriod): string | null {
  const priceId = PLAN_PRICES[plan]?.[period];
  return priceId && priceId.length > 0 ? priceId : null;
}
