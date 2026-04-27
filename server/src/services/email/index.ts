// API publique du système de templates email NORMX Tax.
//
//   import { renderEmail } from '@/services/email';
//   const { subject, html } = renderEmail('fiscal-deadlines', { ... });

export { renderEmail, type TemplateName, type TemplateRegistry, type RenderedEmail } from "./render";
export { addUtm } from "./utm";
export {
  BRAND,
  benefitsList,
  ctaButton,
  ctaButtonPair,
  definitionList,
  detailsBox,
  discountBadge,
  eyebrow,
  fallbackLink,
  featuredCard,
  getProductDisplayName,
  highlightBox,
  infoBox,
  newsItem,
  numberedSteps,
  paragraph,
  promoCode,
  renderBaseLayout,
  sectionTitle,
  softBox,
  statsRow,
  tipCard,
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
export type { NewsletterVars, NewsletterArticle, NewsletterStat } from "./templates/newsletter.template";
export type { PromoVars } from "./templates/promo.template";
