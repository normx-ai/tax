import { Router, Request, Response } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/keycloak-auth";
import { resolveTenant, requireOrg } from "../middleware/tenant.middleware";
import { requireOwner } from "../middleware/orgRole.middleware";
import { typedRoute } from "../middleware/typed-route";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  createCheckoutSession,
  handleWebhookEvent,
  verifyWebhookSignature,
  isStripeEnabled,
} from "../services/stripe.service";
import { createLogger } from "../utils/logger";

const logger = createLogger("StripeRoutes");

const router = Router();

const checkoutBody = z.object({
  plan: z.enum(["PRO"]),
  period: z.enum(["monthly", "yearly"]),
});

router.post(
  "/checkout",
  requireAuth,
  resolveTenant,
  requireOrg,
  requireOwner,
  ...typedRoute({ body: checkoutBody }, async (req, res) => {
    if (!isStripeEnabled()) {
      res.status(503).json({ error: "Paiements par carte indisponibles, contactez le support." });
      return;
    }

    const { plan, period } = req.validated.body;
    const result = await createCheckoutSession({
      orgId: req.orgId!,
      plan,
      period,
      customerEmail: req.userEmail!,
      customerName: req.userEmail!,
    });

    res.json({ url: result.url, sessionId: result.sessionId });
  }),
);

// Webhook Stripe — public, signature verifiee.
// IMPORTANT : monte avec express.raw, pas express.json (cf. app.ts).
export const stripeWebhookHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!isStripeEnabled()) {
    res.status(503).send("Stripe disabled");
    return;
  }

  const signature = req.headers["stripe-signature"];
  if (typeof signature !== "string") {
    res.status(400).send("Signature Stripe manquante");
    return;
  }

  if (!Buffer.isBuffer(req.body)) {
    res.status(400).send("Body brut requis pour la verification de signature");
    return;
  }

  try {
    const event = verifyWebhookSignature(req.body, signature);
    await handleWebhookEvent(event);
    res.json({ received: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "verification echouee";
    logger.error(`Webhook Stripe rejete : ${msg}`);
    res.status(400).send(`Webhook Error: ${msg}`);
  }
});

export default router;
