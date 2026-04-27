// Template "Confirmation d'annulation" — résiliation d'abonnement.
//
// Visuel : header navy + tag "Confirmation d'annulation". Hero rond or
// pâle avec emoji 👋. Heading center "Votre abonnement a bien été annulé"
// + sous-titre nominatif. infoBox or "Accès maintenu jusqu'au X",
// definitionList récap (formule / date annulation / fin d'accès), bloc
// "Que deviennent vos données ?" avec mention RGPD/DPO, CTA primary
// "Réactiver mon abonnement", softBox feedback (avis 2 minutes), closing
// centered italic "Merci d'avoir fait confiance".

import {
  BRAND,
  FONT,
  ctaButton,
  definitionList,
  escapeHtml,
  getProductDisplayName,
  infoBox,
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
  /** Prénom du destinataire */
  userName: string;
  /** Nom du plan annulé — ex: "NORMX Tax Pro" */
  planName: string;
  /** Date d'annulation (ISO) */
  cancellationDate: string;
  /** Date de fin d'accès (ISO) — fin de la période payée */
  accessEndDate: string;
  /** Nombre de jours de rétention des données après accessEndDate. Default: 90 */
  retentionDays?: number;
  /** Lien réactivation abonnement */
  reactivateUrl: string;
  /** Lien sondage de feedback */
  feedbackUrl: string;
  /** Email DPO pour les demandes RGPD. Default: dpo@normx-ai.com */
  dpoEmail?: string;
  /** Lien désinscription emails marketing (l'annulation reste transactionnelle critique) */
  unsubscribeUrl?: string;
}

interface RenderedEmail {
  subject: string;
  html: string;
}

export function renderSubscriptionCancelled(vars: SubscriptionCancelledVars): RenderedEmail {
  const {
    product,
    userName,
    planName,
    cancellationDate,
    accessEndDate,
    retentionDays = 90,
    reactivateUrl,
    feedbackUrl,
    dpoEmail,
    unsubscribeUrl,
  } = vars;
  const reactivateWithUtm = addUtm(reactivateUrl, { campaign: CAMPAIGN, content: "cta-reactivate" });
  const feedbackWithUtm = addUtm(feedbackUrl, { campaign: CAMPAIGN, content: "cta-feedback" });
  const productName = getProductDisplayName(product);
  const dpo = dpoEmail ?? "dpo@normx-ai.com";
  const accessEndFormatted = formatDate(accessEndDate);

  const subject = `Votre abonnement ${productName} est annulé`;
  const preheader = `Confirmation : votre accès reste actif jusqu'au ${accessEndFormatted}.`;

  const content = `
${infoBox(
    `✓ Accès maintenu jusqu'au ${accessEndFormatted}`,
    `Vous pouvez continuer à utiliser ${escapeHtml(productName)} normalement jusqu'à cette date. Aucun nouveau prélèvement ne sera effectué.`,
  )}

${definitionList([
    { label: "Formule annulée", value: planName },
    { label: "Date d'annulation", value: formatDate(cancellationDate) },
    { label: "Fin d'accès", value: accessEndFormatted },
  ])}

<p style="margin: 0 0 8px 0; color: ${BRAND.navy}; font-family: ${FONT}; font-size: 14px; font-weight: 600;">
  📦 Que deviennent vos données ?
</p>
${paragraph(
    `Vos données sont conservées pendant <strong style="color: ${BRAND.navy};">${retentionDays} jours</strong> après la fin de votre accès. Pendant cette période, vous pouvez réactiver votre compte à tout moment et retrouver l'intégralité de votre historique.`,
  )}
<p style="margin: -8px 0 24px 0; color: ${BRAND.textMuted}; font-family: ${FONT}; font-size: 12px; line-height: 20px; font-style: italic;">
  Pour exercer vos droits RGPD (effacement immédiat, portabilité), contactez <a href="mailto:${escapeHtml(dpo)}" style="color: ${BRAND.gold}; text-decoration: none; font-weight: 600;">${escapeHtml(dpo)}</a>.
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding: 0 0 24px 0;">
      ${ctaButton({ text: "Réactiver mon abonnement", url: reactivateWithUtm, variant: "primary" })}
    </td>
  </tr>
</table>

${softBox(`
<p style="margin: 0 0 8px 0; color: ${BRAND.navy}; font-family: ${FONT}; font-size: 14px; font-weight: 600;">
  💬 Aidez-nous à nous améliorer
</p>
<p style="margin: 0 0 12px 0; color: ${BRAND.textBody}; font-family: ${FONT}; font-size: 13px; line-height: 22px;" class="nx-text-body">
  Pourquoi avez-vous choisi de partir ? Vos retours nous sont précieux pour faire évoluer ${escapeHtml(productName)}.
</p>
<a href="${escapeHtml(feedbackWithUtm)}" style="color: ${BRAND.gold}; font-family: ${FONT}; font-size: 13px; font-weight: 600; text-decoration: none;">
  Donner mon avis (2 minutes) →
</a>`)}

<p style="margin: 0; color: ${BRAND.textBody}; font-family: ${FONT}; font-size: 14px; line-height: 22px; font-style: italic; text-align: center;" class="nx-text-body">
  Merci d'avoir fait confiance à ${escapeHtml(productName)}.<br/>Nous serons ravis de vous retrouver bientôt. 🙏
</p>
`;

  const html = renderBaseLayout({
    preheader,
    product,
    headerTag: "Confirmation d'annulation",
    heroIcon: { symbol: "👋", bg: BRAND.goldPale, fg: BRAND.navy },
    heading: "Votre abonnement a bien été annulé",
    headingAlign: "center",
    subheading: `Bonjour <strong style="color: ${BRAND.navy};">${escapeHtml(userName)}</strong>, nous confirmons l'annulation de votre abonnement ${escapeHtml(productName)}.`,
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
    timeZone: "Europe/Paris",
  });
}
