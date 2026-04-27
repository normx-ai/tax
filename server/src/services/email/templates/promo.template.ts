// Template "Offre exclusive / promo" — communication commerciale.
//
// Visuel : header navy + tag "Offre exclusive". Hero édito (eyebrow or
// "⭐ Offre limitée" + H1 34px + sub). discountBadge gros or dégradé
// (label + valeur 64px + cible). promoCode encadré dashed or pâle
// (monospace letter-spacing 4px) + validité. Description centrée.
// benefitsList avec check or. CTA primary or grand format. Mention
// urgence rouge "⚡ Plus que X jours". Fine print (CGV) en italic.
// Footer variant 'marketing' : Se désabonner / CGV / Confidentialité.

import {
  BRAND,
  FONT,
  benefitsList,
  ctaButton,
  discountBadge,
  escapeHtml,
  eyebrow,
  promoCode,
  renderBaseLayout,
  type Product,
} from "../base.template";
import { addUtm } from "../utm";

const CAMPAIGN = "promo";

export interface PromoVars {
  /** Produit qui émet la promo. Default: "tax". */
  product?: Product;

  // Hero
  /** Titre principal — H1 34px ex: "30% sur l'abonnement annuel" */
  offerHeadline: string;
  /** Sous-titre sous le H1 */
  offerSubheadline: string;
  /** Eyebrow au-dessus du H1 — default "⭐ Offre limitée" */
  offerEyebrow?: string;

  // Discount badge
  /** Label dans le badge — default "Économisez" */
  discountLabel?: string;
  /** Valeur principale — ex: "30%" / "-150 €" / "2 mois offerts" */
  discountValue: string;
  /** Texte sous la valeur — ex: "sur l'abonnement annuel" */
  discountTarget: string;

  // Code promo
  /** Code à saisir au checkout — ex: "RENTREE2026" */
  promoCode: string;
  /** Date de fin de validité de l'offre (ISO) */
  expiryDate: string;

  // Description et bénéfices
  /** Paragraphe descriptif centré sous le code */
  offerDescription: string;
  /** Liste de bénéfices inclus dans l'offre — 3 à 5 items idéalement */
  benefits: string[];

  // CTA
  /** Lien d'application de l'offre (page checkout, dashboard) */
  ctaUrl: string;
  /** Texte du bouton — default "Profiter de l'offre" */
  ctaLabel?: string;

  // Mention legale + désinscription
  /** Conditions de l'offre en italic — ex: "Offre valable une seule fois par client..." */
  termsAndConditions: string;
  unsubscribeUrl: string;
}

interface RenderedEmail {
  subject: string;
  html: string;
}

export function renderPromo(vars: PromoVars): RenderedEmail {
  const {
    product,
    offerHeadline,
    offerSubheadline,
    offerEyebrow,
    discountLabel,
    discountValue,
    discountTarget,
    promoCode: code,
    expiryDate,
    offerDescription,
    benefits,
    ctaUrl,
    ctaLabel,
    termsAndConditions,
    unsubscribeUrl,
  } = vars;

  const ctaWithUtm = addUtm(ctaUrl, { campaign: CAMPAIGN, content: `cta-${code.toLowerCase()}` });
  const daysLeft = daysUntil(expiryDate);
  const expiryFormatted = formatDate(expiryDate);

  const subject = `${offerHeadline} — Plus que ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`;
  const preheader = `${offerSubheadline} — Code ${code} valable jusqu'au ${expiryFormatted}.`;

  // --------------------------------------------------------------------------
  // Hero édito (pas de hero icon, pas de heading par défaut, titre custom)
  // --------------------------------------------------------------------------
  const heroEdito = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center">
      ${eyebrow(offerEyebrow ?? "⭐ Offre limitée", "gold")}
      <h1 class="nx-h1 nx-text" style="margin: 0; font-family: ${FONT}; font-size: 34px; font-weight: 700; line-height: 40px; letter-spacing: -0.8px; color: ${BRAND.navy};">
        ${escapeHtml(offerHeadline)}
      </h1>
      <p class="nx-text-body" style="margin: 16px 0 0 0; font-family: ${FONT}; font-size: 16px; line-height: 26px; color: ${BRAND.textBody};">
        ${escapeHtml(offerSubheadline)}
      </p>
    </td>
  </tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 32px 0 24px 0;">
  <tr>
    <td align="center">
      ${discountBadge({ label: discountLabel ?? "Économisez", value: discountValue, target: discountTarget })}
    </td>
  </tr>
</table>

${promoCode({ code, expiryNote: `⏱ Valable jusqu'au <strong style="color: ${BRAND.navy};">${expiryFormatted}</strong>` })}

<p style="margin: 24px 0; color: ${BRAND.textBody}; font-family: ${FONT}; font-size: 14px; line-height: 24px; text-align: center;" class="nx-text-body">
  ${escapeHtml(offerDescription)}
</p>

${benefitsList({ title: "Ce que vous obtenez", items: benefits })}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding: 0 0 16px 0;">
      ${ctaButton({ text: `${ctaLabel ?? "Profiter de l'offre"} →`, url: ctaWithUtm, variant: "primary" })}
    </td>
  </tr>
</table>

<p style="margin: 0 0 24px 0; color: #DC2626; font-family: ${FONT}; font-size: 13px; font-weight: 600; text-align: center;">
  ⚡ Plus que ${daysLeft} jour${daysLeft > 1 ? "s" : ""} pour en profiter
</p>

<p style="margin: 0; color: ${BRAND.textMuted}; font-family: ${FONT}; font-size: 11px; line-height: 18px; text-align: center; font-style: italic;">
  ${escapeHtml(termsAndConditions)}
</p>`;

  const html = renderBaseLayout({
    preheader,
    product,
    headerTag: "Offre exclusive",
    // Pas de heading global : le hero édito gère son propre H1
    content: heroEdito,
    unsubscribeUrl,
    footerVariant: "marketing",
  });

  return { subject, html };
}

// -----------------------------------------------------------------------------
// Utilitaires de date
// -----------------------------------------------------------------------------

function daysUntil(iso: string): number {
  const now = new Date();
  const due = new Date(iso);
  const utcNow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const utcDue = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  return Math.max(0, Math.round((utcDue - utcNow) / 86_400_000));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}
