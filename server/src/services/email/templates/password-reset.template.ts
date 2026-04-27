// Template "Réinitialisation de mot de passe".
//
// Visuel : header navy + logo NORMX AI (umbrella auth) + tag "🔒 Sécurité".
// Hero rond or pâle bordé or avec emoji 🔑. Heading center "Réinitialisation
// du mot de passe", sous-titre nominatif. Instructions courtes, CTA or
// "Réinitialiser mon mot de passe →". Fallback link en monospace.
// warningBox sécurité ("Vous n'êtes pas à l'origine ?" + contact support).
// detailsBox de la demande (date, IP, user-agent). Pas d'unsubscribe.

import {
  BRAND,
  FONT,
  ctaButton,
  detailsBox,
  escapeHtml,
  fallbackLink,
  getProductDisplayName,
  paragraph,
  renderBaseLayout,
  warningBox,
  type Product,
} from "../base.template";
import { addUtm } from "../utm";

const CAMPAIGN = "password-reset";

export interface PasswordResetVars {
  /** Produit qui demande la réinitialisation. Default: "auth" (umbrella NORMX AI). */
  product?: Product;
  /** Prénom du destinataire (laissé vide si compte anonyme) */
  userName?: string;
  /** Lien magique signé (1 utilisation, expire après expiryHours) */
  resetUrl: string;
  /** Validité du lien en heures — ex: 1 */
  expiryHours: number;
  /** Date de la demande (ISO) */
  requestDate: string;
  /** Localisation IP — ex: "Paris, France · 78.193.x.x" */
  ipLocation: string;
  /** User-agent abrégé — ex: "Chrome 132 sur macOS" */
  userAgent: string;
  /** Email de support pour signaler une demande non sollicitée. Default: support@normx-ai.com */
  supportEmail?: string;
}

interface RenderedEmail {
  subject: string;
  html: string;
}

export function renderPasswordReset(vars: PasswordResetVars): RenderedEmail {
  const {
    product = "auth",
    userName,
    resetUrl,
    expiryHours,
    requestDate,
    ipLocation,
    userAgent,
    supportEmail,
  } = vars;
  const resetWithUtm = addUtm(resetUrl, { campaign: CAMPAIGN, content: "cta-reset" });
  const productName = getProductDisplayName(product);
  const helpEmail = supportEmail ?? "support@normx-ai.com";

  const subject = `Réinitialisation de votre mot de passe ${productName}`;
  const preheader = `Lien valable ${expiryHours} heure${expiryHours > 1 ? "s" : ""}. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`;

  const greeting = userName
    ? `Bonjour <strong style="color: ${BRAND.navy};">${escapeHtml(userName)}</strong>, vous avez demandé à réinitialiser votre mot de passe ${escapeHtml(productName)}.`
    : `Bonjour, vous avez demandé à réinitialiser votre mot de passe ${escapeHtml(productName)}.`;

  const content = `
${paragraph(
    `Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe. Ce lien est valable <strong style="color: ${BRAND.navy};">${expiryHours} heure${expiryHours > 1 ? "s" : ""}</strong>.`,
  )}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding: 0 0 24px 0;">
      ${ctaButton({ text: "Réinitialiser mon mot de passe →", url: resetWithUtm, variant: "primary" })}
    </td>
  </tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0;">
  <tr>
    <td>
      ${fallbackLink(resetWithUtm)}
    </td>
  </tr>
</table>

${warningBox(
    "⚠ Vous n'êtes pas à l'origine de cette demande ?",
    `Ignorez ce message — votre mot de passe restera inchangé. Si vous recevez plusieurs emails de ce type, contactez-nous immédiatement à <a href="mailto:${escapeHtml(helpEmail)}" style="color: #92400E; font-weight: 600;">${escapeHtml(helpEmail)}</a>.`,
  )}

${detailsBox("Détails de la demande", [
    { icon: "📅", label: formatDateTime(requestDate) },
    { icon: "🌍", label: ipLocation },
    { icon: "💻", label: userAgent },
  ])}
`;

  const html = renderBaseLayout({
    preheader,
    product,
    headerTag: "🔒 Sécurité",
    heroIcon: { symbol: "🔑", bg: BRAND.goldPale, fg: BRAND.navy, borderColor: BRAND.gold },
    heading: "Réinitialisation du mot de passe",
    headingAlign: "center",
    subheading: greeting,
    content,
    // Pas de unsubscribeUrl : transactionnel critique sécurité
  });

  return { subject, html };
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}
