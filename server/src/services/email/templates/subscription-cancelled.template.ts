// Template "Abonnement annulé" — confirmation de résiliation.

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

const CAMPAIGN = "subscription-cancelled";

export interface SubscriptionCancelledVars {
  /** Produit annulé (Tax / Finance / Legal). Default: "tax". */
  product?: Product;
  userName: string;
  organizationName: string;
  planName: string;
  accessUntil: string; // ISO date — fin d'accès garantie
  reactivateUrl: string;
  unsubscribeUrl: string;
}

interface RenderedEmail {
  subject: string;
  html: string;
}

export function renderSubscriptionCancelled(vars: SubscriptionCancelledVars): RenderedEmail {
  const { product, userName, organizationName, planName, accessUntil, reactivateUrl, unsubscribeUrl } = vars;
  const reactivateWithUtm = addUtm(reactivateUrl, { campaign: CAMPAIGN, content: "cta-reactivate" });

  const subject = `Confirmation d'annulation — ${planName}`;
  const preheader = `Votre accès reste actif jusqu'au ${formatDate(accessUntil)}.`;

  const content = `
${paragraph(`Bonjour <strong style="color: ${BRAND.navy};">${escapeHtml(userName)}</strong>,`)}
${paragraph(
    `Nous confirmons l'annulation de l'abonnement <strong style="color: ${BRAND.navy};">${escapeHtml(planName)}</strong> pour <strong style="color: ${BRAND.navy};">${escapeHtml(organizationName)}</strong>.`,
  )}
${paragraph(
    `Votre accès reste actif jusqu'au <strong style="color: ${BRAND.navy};">${formatDate(accessUntil)}</strong>. Au-delà, votre espace passe en mode lecture seule (consultation uniquement, pas d'agent IA ni de simulateur).`,
  )}

${softBox(`
<p style="margin: 0; font-family: ${FONT}; font-size: 14px; font-weight: 600; color: ${BRAND.navy};">
  Vos données sont conservées
</p>
<p style="margin: 8px 0 0 0; font-family: ${FONT}; font-size: 13px; line-height: 22px; color: ${BRAND.textBody};" class="nx-text-body">
  Vos entités, déclarations et historiques restent accessibles. Vous pourrez réactiver l'abonnement à tout moment et reprendre exactement où vous vous êtes arrêté.
</p>`)}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding: 8px 0 24px 0;">
      ${ctaButton({ text: "Réactiver mon abonnement", url: reactivateWithUtm, variant: "secondary" })}
    </td>
  </tr>
</table>

${paragraph(
    `Si vous avez un retour à nous partager pour améliorer le service, répondez simplement à cet email — nous lisons toutes les réponses.`,
  )}
`;

  const html = renderBaseLayout({
    preheader,
    product,
    badge: { text: "Annulation confirmée" },
    heading: "Votre abonnement est annulé",
    content,
    unsubscribeUrl,
  });

  return { subject, html };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
