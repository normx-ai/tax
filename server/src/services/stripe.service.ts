// La SDK Stripe v22 exporte en CJS via `export = StripeConstructor`,
// ce qui casse l'acces au namespace `Stripe.Event/Subscription/...`.
// On reimporte les types via le module interne `stripe.core` pour les retrouver.
import type { Stripe as StripeNS } from "stripe/cjs/stripe.core";
import prisma from "../utils/prisma";
import { createLogger } from "../utils/logger";
import {
  stripe,
  isStripeEnabled,
  STRIPE_WEBHOOK_SECRET,
  STRIPE_SUCCESS_URL,
  STRIPE_CANCEL_URL,
  getStripePriceId,
  type BillingPeriod,
} from "../config/stripe";
import { activateSubscription, renewSubscription } from "./subscription.service";
import type { PlanName } from "../types/plans";

type StripeClient = StripeNS;
type StripeEvent = StripeNS.Event;
type StripeSubscription = StripeNS.Subscription;
type StripeCheckoutSession = StripeNS.Checkout.Session;
type StripeInvoice = StripeNS.Invoice;

const logger = createLogger("StripeService");

interface CreateCheckoutInput {
  orgId: string;
  plan: PlanName;
  period: BillingPeriod;
  customerEmail: string;
  customerName: string;
}

interface CheckoutResult {
  url: string;
  sessionId: string;
}

function ensureStripe(): StripeClient {
  if (!stripe) {
    throw new Error("Stripe n'est pas configure (STRIPE_SECRET_KEY manquant)");
  }
  return stripe;
}

export async function createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutResult> {
  const client = ensureStripe();

  if (input.plan === "FREE") {
    throw new Error("Le plan FREE ne necessite pas de paiement");
  }

  const priceId = getStripePriceId(input.plan, input.period);
  if (!priceId) {
    throw new Error(
      `Aucun Price ID Stripe configure pour ${input.plan}/${input.period}. ` +
      `Definir STRIPE_PRICE_ID_${input.plan}_${input.period.toUpperCase()} dans .env`,
    );
  }

  if (!STRIPE_SUCCESS_URL || !STRIPE_CANCEL_URL) {
    throw new Error("STRIPE_SUCCESS_URL et STRIPE_CANCEL_URL doivent etre definis");
  }

  const subscription = await prisma.subscription.findUnique({
    where: { organizationId: input.orgId },
  });
  if (!subscription) {
    throw new Error("Abonnement local introuvable pour l'organisation");
  }

  let stripeCustomerId = subscription.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await client.customers.create({
      email: input.customerEmail,
      name: input.customerName,
      metadata: { orgId: input.orgId },
      invoice_settings: {
        footer: "Mediation de la consommation : CM2C, 49 rue de Ponthieu, 75008 Paris — www.cm2c.net — litiges@cm2c.net",
      },
    });
    stripeCustomerId = customer.id;
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { stripeCustomerId },
    });
    logger.info(`Customer Stripe cree pour org ${input.orgId} : ${stripeCustomerId}`);
  }

  const session = await client.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${STRIPE_SUCCESS_URL}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: STRIPE_CANCEL_URL,
    locale: "fr",
    metadata: { orgId: input.orgId, plan: input.plan, period: input.period },
    subscription_data: {
      metadata: { orgId: input.orgId, plan: input.plan, period: input.period },
    },
  });

  if (!session.url) {
    throw new Error("Stripe n'a pas retourne d'URL de checkout");
  }

  logger.info(`Session Checkout creee : ${session.id} (org ${input.orgId}, plan ${input.plan}/${input.period})`);
  return { url: session.url, sessionId: session.id };
}

export function verifyWebhookSignature(rawBody: Buffer, signature: string): StripeEvent {
  const client = ensureStripe();
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET n'est pas defini");
  }
  return client.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
}

export async function handleWebhookEvent(event: StripeEvent): Promise<void> {
  logger.info(`Webhook recu : ${event.type} (${event.id})`);

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object);
      break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object);
      break;
    default:
      logger.debug(`Evenement Stripe ignore : ${event.type}`);
  }
}

async function handleCheckoutCompleted(session: StripeCheckoutSession): Promise<void> {
  const orgId = session.metadata?.orgId;
  const plan = session.metadata?.plan as PlanName | undefined;

  if (!orgId || !plan) {
    logger.warn(`Checkout sans metadata orgId/plan : ${session.id}`);
    return;
  }

  const localSub = await prisma.subscription.findUnique({ where: { organizationId: orgId } });
  if (!localSub) {
    logger.error(`Abonnement local introuvable pour org ${orgId}`);
    return;
  }

  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  if (stripeSubscriptionId) {
    await prisma.subscription.update({
      where: { id: localSub.id },
      data: { stripeSubscriptionId },
    });
  }

  if (localSub.plan === "FREE") {
    await activateSubscription(orgId, plan);
  } else {
    await renewSubscription(orgId);
  }
  logger.info(`Abonnement active via Checkout : org ${orgId}, plan ${plan}`);
}

async function handleSubscriptionUpdated(sub: StripeSubscription): Promise<void> {
  const orgId = sub.metadata?.orgId;
  if (!orgId) return;

  const localSub = await prisma.subscription.findUnique({ where: { organizationId: orgId } });
  if (!localSub) return;

  const status = mapStripeStatus(sub.status);
  await prisma.subscription.update({
    where: { id: localSub.id },
    data: {
      status,
      stripeSubscriptionId: sub.id,
      currentPeriodEnd: sub.items.data[0]?.current_period_end
        ? new Date(sub.items.data[0].current_period_end * 1000)
        : localSub.currentPeriodEnd,
    },
  });
  logger.info(`Subscription mise a jour : org ${orgId} → ${status}`);
}

async function handleSubscriptionDeleted(sub: StripeSubscription): Promise<void> {
  const orgId = sub.metadata?.orgId;
  if (!orgId) return;

  const localSub = await prisma.subscription.findUnique({ where: { organizationId: orgId } });
  if (!localSub) return;

  await prisma.subscription.update({
    where: { id: localSub.id },
    data: {
      plan: "FREE",
      status: "CANCELLED",
      cancelledAt: new Date(),
      stripeSubscriptionId: null,
    },
  });
  logger.info(`Subscription annulee : org ${orgId} → FREE`);
}

async function handleInvoicePaymentFailed(invoice: StripeInvoice): Promise<void> {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const localSub = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!localSub) return;

  await prisma.subscription.update({
    where: { id: localSub.id },
    data: { status: "PAST_DUE" },
  });
  logger.warn(`Paiement echoue : org ${localSub.organizationId} → PAST_DUE`);
}

function mapStripeStatus(stripeStatus: StripeNS.Subscription.Status): "ACTIVE" | "CANCELLED" | "PAST_DUE" | "TRIALING" {
  switch (stripeStatus) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
    case "incomplete":
    case "incomplete_expired":
    case "paused":
      return "CANCELLED";
    default:
      return "PAST_DUE";
  }
}

export { isStripeEnabled };
