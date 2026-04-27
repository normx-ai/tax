// Template "Paiement Stripe confirmé".
//
// Visuel : header navy avec tag "Reçu de paiement", hero icon ✓ vert,
// heading centered "Paiement confirmé" + sous-titre. Encadré or pâle
// avec référence + plan + montant + date/mode de paiement. Mention TVA
// art. 293 B (NORMX AI SAS en franchise). Double CTA primary + outline.
// Bloc soft "Prochain renouvellement". PDF de la facture en pièce jointe.

import {
  BRAND,
  FONT,
  ctaButtonPair,
  escapeHtml,
  paragraph,
  renderBaseLayout,
  softBox,
  type Product,
} from "../base.template";
import { addUtm } from "../utm";

const CAMPAIGN = "payment-success";

export interface PaymentSuccessVars {
  /** Produit facturé (Tax / Finance / Legal). Default: "tax". */
  product?: Product;
  userName: string;
  /** Numéro de facture — ex: "INV-2026-0042" */
  invoiceNumber: string;
  /** Nom du plan — ex: "NORMX Tax Pro" */
  planName: string;
  /** Période de facturation — ex: "Abonnement mensuel" / "Abonnement annuel" */
  billingPeriod: string;
  /** Montant payé HT (NORMX AI SAS en franchise TVA art. 293 B = pas de TVA) */
  amount: string;
  /** Devise ISO — ex: "EUR" */
  currency: string;
  /** Date du paiement (ISO) */
  paymentDate: string;
  /** Mode — ex: "Carte Visa •••• 4242" */
  paymentMethod: string;
  /** Date du prochain prélèvement (ISO) */
  nextRenewalDate: string;
  /** Lien direct vers la facture PDF */
  invoiceUrl: string;
  /** Lien vers l'espace abonnement */
  dashboardUrl: string;
}

interface RenderedEmail {
  subject: string;
  html: string;
}

export function renderPaymentSuccess(vars: PaymentSuccessVars): RenderedEmail {
  const {
    product,
    userName,
    invoiceNumber,
    planName,
    billingPeriod,
    amount,
    currency,
    paymentDate,
    paymentMethod,
    nextRenewalDate,
    invoiceUrl,
    dashboardUrl,
  } = vars;

  const invoiceWithUtm = addUtm(invoiceUrl, { campaign: CAMPAIGN, content: "cta-invoice" });
  const dashboardWithUtm = addUtm(dashboardUrl, { campaign: CAMPAIGN, content: "cta-account" });

  const subject = `Paiement confirmé — Facture ${invoiceNumber}`;
  const preheader = `Merci ${userName}, votre paiement de ${amount} ${currency} a bien été reçu. Prochain prélèvement : ${formatDate(nextRenewalDate)}.`;

  const content = `
${receiptCard({
    invoiceNumber,
    planName,
    billingPeriod,
    amount,
    currency,
    paymentDate,
    paymentMethod,
  })}

<p style="margin: 0 0 24px 0; font-family: ${FONT}; font-size: 11px; line-height: 18px; color: ${BRAND.textMuted}; font-style: italic;">
  TVA non applicable, art. 293 B du CGI (franchise en base, NORMX AI SAS).
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding: 0 0 24px 0;">
      ${ctaButtonPair(
        { text: "📄 Télécharger la facture", url: invoiceWithUtm },
        { text: "Mon compte", url: dashboardWithUtm },
      )}
    </td>
  </tr>
</table>

${softBox(`
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td>
      <p style="margin: 0; font-family: ${FONT}; font-size: 12px; color: ${BRAND.textBody};" class="nx-text-body">
        Prochain renouvellement
      </p>
      <p style="margin: 4px 0 0 0; font-family: ${FONT}; font-size: 14px; font-weight: 600; color: ${BRAND.navy};">
        ${formatDate(nextRenewalDate)}
      </p>
    </td>
    <td align="right" valign="middle">
      <p style="margin: 0; font-family: ${FONT}; font-size: 12px; color: ${BRAND.textBody};" class="nx-text-body">
        Vous pouvez modifier ou annuler à tout moment depuis votre compte.
      </p>
    </td>
  </tr>
</table>`)}
`;

  const html = renderBaseLayout({
    preheader,
    product,
    headerTag: "Reçu de paiement",
    heroIcon: { symbol: "✓", bg: "#DCFCE7", fg: "#16A34A" },
    heading: "Paiement confirmé",
    headingAlign: "center",
    subheading: `Merci <strong style="color: ${BRAND.navy};">${escapeHtml(userName)}</strong>, votre paiement a bien été reçu.`,
    content,
    // Pas de unsubscribeUrl : transactionnel critique (facturation)
  });

  return { subject, html };
}

// -----------------------------------------------------------------------------
// Carte reçu : référence + plan + montant + date/mode de paiement.
// Reproduit la maquette (encadré or pâle avec section blanche en bas).
// -----------------------------------------------------------------------------

interface ReceiptCardArgs {
  invoiceNumber: string;
  planName: string;
  billingPeriod: string;
  amount: string;
  currency: string;
  paymentDate: string;
  paymentMethod: string;
}

function receiptCard(args: ReceiptCardArgs): string {
  const { invoiceNumber, planName, billingPeriod, amount, currency, paymentDate, paymentMethod } = args;

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="nx-pale-bg nx-pale-border" style="background-color: ${BRAND.goldPale}; border: 1px solid ${BRAND.goldBorder}; border-radius: 8px; margin: 0 0 16px 0;">
  <tr>
    <td style="padding: 20px 24px 12px 24px;">
      <p style="margin: 0 0 4px 0; color: ${BRAND.textMuted}; font-family: ${FONT}; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">
        Référence
      </p>
      <p style="margin: 0; color: ${BRAND.navy}; font-family: 'Courier New', Consolas, monospace; font-size: 14px;">
        ${escapeHtml(invoiceNumber)}
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 24px 16px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <p style="margin: 0; color: ${BRAND.navy}; font-family: ${FONT}; font-size: 15px; font-weight: 600; line-height: 22px;">
              ${escapeHtml(planName)}
            </p>
            <p style="margin: 4px 0 0 0; color: ${BRAND.textBody}; font-family: ${FONT}; font-size: 13px;" class="nx-text-body">
              ${escapeHtml(billingPeriod)}
            </p>
          </td>
          <td align="right" valign="top" style="white-space: nowrap; padding-left: 16px;">
            <p style="margin: 0; color: ${BRAND.navy}; font-family: ${FONT}; font-size: 18px; font-weight: 700; letter-spacing: -0.3px;">
              ${escapeHtml(amount)} ${escapeHtml(currency)}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td class="nx-card" style="padding: 16px 24px; border-top: 1px solid ${BRAND.goldBorder}; background-color: ${BRAND.white}; border-radius: 0 0 8px 8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td valign="top">
            <p style="margin: 0; color: ${BRAND.textBody}; font-family: ${FONT}; font-size: 12px;" class="nx-text-body">
              Date du paiement
            </p>
            <p style="margin: 2px 0 0 0; color: ${BRAND.navy}; font-family: ${FONT}; font-size: 13px; font-weight: 600;">
              ${formatDateTime(paymentDate)}
            </p>
          </td>
          <td align="right" valign="top">
            <p style="margin: 0; color: ${BRAND.textBody}; font-family: ${FONT}; font-size: 12px;" class="nx-text-body">
              Mode de paiement
            </p>
            <p style="margin: 2px 0 0 0; color: ${BRAND.navy}; font-family: ${FONT}; font-size: 13px; font-weight: 600;">
              ${escapeHtml(paymentMethod)}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
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

// suppress unused import warnings (paragraph kept for back-compat consumers)
void paragraph;
