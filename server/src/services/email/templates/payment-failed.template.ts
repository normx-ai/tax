// Template "Échec de paiement" — relance avec lien de retry Stripe.

import {
  BRAND,
  FONT,
  ctaButton,
  escapeHtml,
  paragraph,
  renderBaseLayout,
  softBox,
  type Product,
} from "../base.template";
import { addUtm } from "../utm";

const CAMPAIGN = "payment-failed";

export interface PaymentFailedVars {
  /** Produit concerné (Tax / Finance / Legal). Default: "tax". */
  product?: Product;
  userName: string;
  organizationName: string;
  amountTtc: string;
  currency: string;
  reason: string; // message Stripe (carte refusée, fonds insuffisants, etc.)
  retryUrl: string; // session Stripe de retry
  gracePeriodDays: number; // jours avant suspension
  unsubscribeUrl: string;
}

interface RenderedEmail {
  subject: string;
  html: string;
}

export function renderPaymentFailed(vars: PaymentFailedVars): RenderedEmail {
  const {
    product,
    userName,
    organizationName,
    amountTtc,
    currency,
    reason,
    retryUrl,
    gracePeriodDays,
    unsubscribeUrl,
  } = vars;
  const retryWithUtm = addUtm(retryUrl, { campaign: CAMPAIGN, content: "cta-retry" });

  const subject = `Action requise — Échec de paiement (${amountTtc} ${currency})`;
  const preheader = `Mettez à jour votre moyen de paiement sous ${gracePeriodDays} jours pour conserver votre accès NORMX Tax.`;

  const content = `
${paragraph(`Bonjour <strong style="color: ${BRAND.navy};">${escapeHtml(userName)}</strong>,`)}
${paragraph(
    `Nous n'avons pas pu prélever le paiement de <strong style="color: ${BRAND.navy};">${escapeHtml(amountTtc)} ${escapeHtml(currency)}</strong> sur l'abonnement de <strong style="color: ${BRAND.navy};">${escapeHtml(organizationName)}</strong>.`,
  )}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; margin: 0 0 24px 0;">
  <tr>
    <td style="padding: 20px 24px;">
      <p style="margin: 0 0 4px 0; color: #DC2626; font-family: ${FONT}; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">
        Motif du refus
      </p>
      <p style="margin: 0; color: ${BRAND.text}; font-family: ${FONT}; font-size: 14px; line-height: 22px;" class="nx-text">
        ${escapeHtml(reason)}
      </p>
    </td>
  </tr>
</table>

${paragraph(
    `Pour conserver votre accès, mettez à jour votre moyen de paiement dans les <strong style="color: ${BRAND.navy};">${gracePeriodDays} prochains jours</strong>. Sans action de votre part, l'abonnement sera suspendu.`,
  )}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding: 8px 0 24px 0;">
      ${ctaButton({ text: "Mettre à jour mon paiement →", url: retryWithUtm, variant: "primary" })}
    </td>
  </tr>
</table>

${softBox(`
<p style="margin: 0; font-family: ${FONT}; font-size: 13px; line-height: 22px; color: ${BRAND.textBody};" class="nx-text-body">
  Une question ? Contactez-nous à <a href="mailto:contact@normx-ai.com" style="color: ${BRAND.gold}; text-decoration: none; font-weight: 600;">contact@normx-ai.com</a>.
</p>`)}
`;

  const html = renderBaseLayout({
    preheader,
    product,
    badge: { text: "Action requise", emoji: "⚠️" },
    heading: "Échec de paiement",
    content,
    unsubscribeUrl,
  });

  return { subject, html };
}
