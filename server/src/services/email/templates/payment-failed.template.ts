// Template "Échec de paiement" — relance avec lien Stripe pour mise à
// jour du moyen de paiement.
//
// Visuel : header navy + tag "Action requise". Hero rond ambre clair
// avec ⚠. Heading center "Votre paiement n'a pas abouti", sous-titre
// avec userName. Encadré ambre warningBox-style avec motif / montant /
// date de tentative. Paragraphe "Que faire maintenant ?" + mention de
// la date de suspension. CTA or "Mettre à jour mon paiement →". Encadré
// gris des causes fréquentes + lien support. Pas d'unsubscribe.

import {
  BRAND,
  FONT,
  ctaButton,
  escapeHtml,
  paragraph,
  renderBaseLayout,
  softBox,
  warningBox,
  type Product,
} from "../base.template";
import { addUtm } from "../utm";

const CAMPAIGN = "payment-failed";

export interface PaymentFailedVars {
  /** Produit concerné (Tax / Finance / Legal). Default: "tax". */
  product?: Product;
  /** Prénom du destinataire */
  userName: string;
  /** Motif Stripe — ex: "Carte refusée par votre banque" */
  failureReason: string;
  /** Montant qui n'a pas pu être prélevé */
  amount: string;
  /** Devise — ex: "EUR" */
  currency: string;
  /** Date / heure de la tentative (ISO) */
  attemptDate: string;
  /** Nombre de jours pendant lesquels Stripe va retenter — ex: 7 */
  retryDays: number;
  /** Date (ISO) à laquelle l'accès sera suspendu sans mise à jour */
  suspensionDate: string;
  /** Lien session Stripe pour mettre à jour le moyen de paiement */
  updatePaymentUrl: string;
  /** Email de support à afficher dans l'encadré aide. Default: support@normx-ai.com */
  supportEmail?: string;
}

interface RenderedEmail {
  subject: string;
  html: string;
}

export function renderPaymentFailed(vars: PaymentFailedVars): RenderedEmail {
  const {
    product,
    userName,
    failureReason,
    amount,
    currency,
    attemptDate,
    retryDays,
    suspensionDate,
    updatePaymentUrl,
    supportEmail,
  } = vars;
  const updateWithUtm = addUtm(updatePaymentUrl, { campaign: CAMPAIGN, content: "cta-update-payment" });
  const helpEmail = supportEmail ?? "support@normx-ai.com";

  const subject = `Action requise — Paiement échoué (${amount} ${currency})`;
  const preheader = `Mettez à jour votre moyen de paiement avant le ${formatDate(suspensionDate)} pour conserver votre accès.`;

  const detailsHtml = `
<strong>Motif :</strong> ${escapeHtml(failureReason)}<br/>
<strong>Montant :</strong> ${escapeHtml(amount)} ${escapeHtml(currency)}<br/>
<strong>Date de tentative :</strong> ${formatDateTime(attemptDate)}`;

  const content = `
${warningBox("Détails de l'échec", detailsHtml)}

<p style="margin: 0 0 12px 0; color: ${BRAND.navy}; font-family: ${FONT}; font-size: 15px; font-weight: 600;">
  Que faire maintenant ?
</p>
${paragraph(
    `Mettez à jour votre moyen de paiement en cliquant sur le bouton ci-dessous. Nous retenterons automatiquement le prélèvement dans les <strong style="color: ${BRAND.navy};">${retryDays} prochains jours</strong>.`,
  )}
<p style="margin: 12px 0 24px 0; color: ${BRAND.textMuted}; font-family: ${FONT}; font-size: 13px; line-height: 22px; font-style: italic;">
  Sans mise à jour, votre accès sera suspendu le <strong style="color: ${BRAND.navy};">${formatDate(suspensionDate)}</strong>.
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding: 0 0 24px 0;">
      ${ctaButton({ text: "Mettre à jour mon paiement →", url: updateWithUtm, variant: "primary" })}
    </td>
  </tr>
</table>

${softBox(`
<p style="margin: 0 0 12px 0; color: ${BRAND.navy}; font-family: ${FONT}; font-size: 14px; font-weight: 600;">
  💡 Causes fréquentes
</p>
<p style="margin: 0; color: ${BRAND.textBody}; font-family: ${FONT}; font-size: 13px; line-height: 22px;" class="nx-text-body">
  &bull; Carte expirée ou bloquée<br/>
  &bull; Plafond de paiement atteint<br/>
  &bull; Solde insuffisant<br/>
  &bull; Opposition par votre banque
</p>
<p style="margin: 12px 0 0 0; color: ${BRAND.textMuted}; font-family: ${FONT}; font-size: 12px;">
  Besoin d'aide ? <a href="mailto:${escapeHtml(helpEmail)}" style="color: ${BRAND.gold}; text-decoration: none; font-weight: 600;">${escapeHtml(helpEmail)}</a>
</p>`)}
`;

  const html = renderBaseLayout({
    preheader,
    product,
    headerTag: "Action requise",
    heroIcon: { symbol: "⚠", bg: "#FEF3C7", fg: "#D97706" },
    heading: "Votre paiement n'a pas abouti",
    headingAlign: "center",
    subheading: `Bonjour <strong style="color: ${BRAND.navy};">${escapeHtml(userName)}</strong>, nous n'avons pas pu prélever votre abonnement.`,
    content,
    // Pas de unsubscribeUrl : transactionnel critique (facturation)
  });

  return { subject, html };
}

// -----------------------------------------------------------------------------
// Utilitaires de date — fuseau Europe/Paris (siège NORMX AI à Amiens).
// -----------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
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
