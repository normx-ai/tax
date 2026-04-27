// Helper renderEmail<K>(name, vars) — sélectionne le template, valide les
// variables (typage par template via TemplateRegistry) et retourne
// { subject, html } prêt à passer à nodemailer.
//
// Usage :
//   const { subject, html } = renderEmail('fiscal-deadlines', { userName: ... });
//   await transporter.sendMail({ to, subject, html, ... });

import {
  renderFiscalDeadlines,
  type FiscalDeadlinesVars,
} from "./templates/fiscal-deadlines.template";
import { renderWelcome, type WelcomeVars } from "./templates/welcome.template";
import {
  renderPaymentSuccess,
  type PaymentSuccessVars,
} from "./templates/payment-success.template";
import {
  renderPaymentFailed,
  type PaymentFailedVars,
} from "./templates/payment-failed.template";
import {
  renderSubscriptionCancelled,
  type SubscriptionCancelledVars,
} from "./templates/subscription-cancelled.template";
import {
  renderPasswordReset,
  type PasswordResetVars,
} from "./templates/password-reset.template";
import { renderOtp, type OtpVars } from "./templates/otp.template";
import { renderNewsletter, type NewsletterVars } from "./templates/newsletter.template";
import { renderPromo, type PromoVars } from "./templates/promo.template";

/**
 * Registry typée : mappe chaque nom de template à son type de variables.
 * Ajouter un template = 3 changements dans CE fichier (import, registry,
 * branche dans le switch). TypeScript force l'exhaustivité du switch.
 */
export interface TemplateRegistry {
  "fiscal-deadlines": FiscalDeadlinesVars;
  welcome: WelcomeVars;
  "payment-success": PaymentSuccessVars;
  "payment-failed": PaymentFailedVars;
  "subscription-cancelled": SubscriptionCancelledVars;
  "password-reset": PasswordResetVars;
  otp: OtpVars;
  newsletter: NewsletterVars;
  promo: PromoVars;
}

export type TemplateName = keyof TemplateRegistry;

export interface RenderedEmail {
  subject: string;
  html: string;
}

/**
 * Sélectionne le template par son nom et l'exécute avec les variables
 * fournies. Type-safe : `vars` est inféré depuis `name` via TemplateRegistry.
 */
export function renderEmail<K extends TemplateName>(
  name: K,
  vars: TemplateRegistry[K],
): RenderedEmail {
  switch (name) {
    case "fiscal-deadlines":
      return renderFiscalDeadlines(vars as FiscalDeadlinesVars);
    case "welcome":
      return renderWelcome(vars as WelcomeVars);
    case "payment-success":
      return renderPaymentSuccess(vars as PaymentSuccessVars);
    case "payment-failed":
      return renderPaymentFailed(vars as PaymentFailedVars);
    case "subscription-cancelled":
      return renderSubscriptionCancelled(vars as SubscriptionCancelledVars);
    case "password-reset":
      return renderPasswordReset(vars as PasswordResetVars);
    case "otp":
      return renderOtp(vars as OtpVars);
    case "newsletter":
      return renderNewsletter(vars as NewsletterVars);
    case "promo":
      return renderPromo(vars as PromoVars);
    default: {
      // Branche d'exhaustivité : TypeScript erreur si un template manque
      const _exhaustive: never = name;
      throw new Error(`Template inconnu : ${String(_exhaustive)}`);
    }
  }
}
