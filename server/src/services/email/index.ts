// API publique du système de templates email NORMX Tax.
//
//   import { renderEmail } from '@/services/email';
//   const { subject, html } = renderEmail('fiscal-deadlines', { ... });

export { renderEmail, type TemplateName, type TemplateRegistry, type RenderedEmail } from "./render";
export { addUtm } from "./utm";
export {
  BRAND,
  ctaButton,
  ctaButtonPair,
  definitionList,
  detailsBox,
  fallbackLink,
  getProductDisplayName,
  highlightBox,
  infoBox,
  numberedSteps,
  paragraph,
  renderBaseLayout,
  softBox,
  warningBox,
  type Product,
} from "./base.template";

// Variables individuelles exportées pour les call sites typés
export type { FiscalDeadlinesVars, FiscalDeadline } from "./templates/fiscal-deadlines.template";
export type { WelcomeVars } from "./templates/welcome.template";
export type { PaymentSuccessVars } from "./templates/payment-success.template";
export type { PaymentFailedVars } from "./templates/payment-failed.template";
export type { SubscriptionCancelledVars } from "./templates/subscription-cancelled.template";
export type { PasswordResetVars } from "./templates/password-reset.template";
export type { OtpVars } from "./templates/otp.template";
