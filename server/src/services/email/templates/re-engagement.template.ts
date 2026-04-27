// Template "Re-engagement / Win-back" — pour les utilisateurs inactifs.
//
// Visuel : header navy + tag "Vous nous manquez". Hero rond or pâle 80×80
// avec emoji 👋. Heading center "{userName}, ça fait longtemps !" 30px +
// sous-titre nominatif (jours d'inactivité). sectionTitle "📰 Ce qui a
// changé" + iconList (3 updates avec emoji custom 36×36, titre, description).
// offerCard "🎁 Cadeau de retrouvailles" (encadré or pâle dégradé bordé
// or 2px avec code dashed). CTA primary "Reprendre mon compte →".
// softBox "💬 Quelque chose ne va pas ?" + signature équipe italic.
// Disclaimer last-chance italic centered.
//
// Footer variant 'newsletter' avec subscriptionContext "...car vous avez
// un compte X" + unsubscribeLabel "Se désabonner définitivement"
// (signal d'intention claire pour respecter l'attention de l'utilisateur).

import {
  BRAND,
  FONT,
  ctaButton,
  escapeHtml,
  getProductDisplayName,
  iconList,
  offerCard,
  paragraph,
  renderBaseLayout,
  sectionTitle,
  softBox,
  type Product,
} from "../base.template";
import { addUtm } from "../utm";

const CAMPAIGN = "re-engagement";

export interface ReEngagementUpdate {
  /** Emoji affiché dans le carré or pâle — ex: "✨" / "⚖" / "🚀" */
  emoji: string;
  /** Titre court de l'évolution */
  title: string;
  /** Description 1-2 phrases */
  description: string;
}

export interface ReEngagementVars {
  /** Produit qui réengage (Tax / Finance / Legal). Default: "tax". */
  product?: Product;

  // Hero
  userName: string;
  /** Nombre de jours depuis la dernière connexion */
  daysSinceLastVisit: number;

  // Section "Ce qui a changé"
  /** Titre de la section — default "📰 Ce qui a changé depuis votre dernière visite" */
  updatesSectionTitle?: string;
  /** Liste des évolutions à mettre en avant — 2 à 5 items idéalement */
  updates: ReEngagementUpdate[];

  // Offre comeback
  /** Titre de l'offre — ex: "30% de réduction sur votre prochain mois" */
  comebackOffer: string;
  /** Description de l'offre */
  offerDescription: string;
  /** Code à saisir au checkout */
  comebackCode: string;
  /** Date de fin de validité (ISO) */
  expiryDate: string;

  // CTA
  /** Lien retour (dashboard) */
  returnUrl: string;
  /** Texte du CTA — default "Reprendre mon compte" */
  returnLabel?: string;

  // Touch personnel
  /** Signature équipe — default "L'équipe NORMX <Produit>" */
  teamSignature?: string;

  // Footer
  unsubscribeUrl: string;
  preferencesUrl: string;
}

interface RenderedEmail {
  subject: string;
  html: string;
}

export function renderReEngagement(vars: ReEngagementVars): RenderedEmail {
  const {
    product,
    userName,
    daysSinceLastVisit,
    updatesSectionTitle,
    updates,
    comebackOffer,
    offerDescription,
    comebackCode,
    expiryDate,
    returnUrl,
    returnLabel,
    teamSignature,
    unsubscribeUrl,
    preferencesUrl,
  } = vars;

  const productName = getProductDisplayName(product);
  const returnWithUtm = addUtm(returnUrl, { campaign: CAMPAIGN, content: `cta-${comebackCode.toLowerCase()}` });
  const expiryFormatted = formatDate(expiryDate);
  const team = teamSignature ?? `L'équipe ${productName}`;

  const subject = `${userName}, ça fait longtemps sur ${productName}…`;
  const preheader = `Vous n'avez pas utilisé ${productName} depuis ${daysSinceLastVisit} jours. ${comebackOffer} avec le code ${comebackCode}.`;

  // --------------------------------------------------------------------------
  // Hero édito (pas de heading global — H1 custom centered)
  // --------------------------------------------------------------------------
  const hero = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center">
      <h1 class="nx-h1 nx-text" style="margin: 0; font-family: ${FONT}; font-size: 30px; font-weight: 700; line-height: 36px; letter-spacing: -0.6px; color: ${BRAND.navy};">
        ${escapeHtml(userName)}, ça fait longtemps !
      </h1>
      <p class="nx-text-body" style="margin: 16px 0 32px 0; font-family: ${FONT}; font-size: 16px; line-height: 26px; color: ${BRAND.textBody};">
        Vous n'avez pas utilisé ${escapeHtml(productName)} depuis <strong style="color: ${BRAND.navy};">${daysSinceLastVisit} jours</strong>. On voulait prendre de vos nouvelles.
      </p>
    </td>
  </tr>
</table>

${sectionTitle(updatesSectionTitle ?? "📰 Ce qui a changé depuis votre dernière visite")}
<div style="margin-top: -8px; margin-bottom: 24px;">
  ${iconList(updates)}
</div>

${offerCard({
  eyebrow: "🎁 Cadeau de retrouvailles",
  title: comebackOffer,
  description: offerDescription,
  code: comebackCode,
  expiryNote: `⏱ Valable jusqu'au <strong style="color: ${BRAND.navy};">${expiryFormatted}</strong>`,
})}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding: 8px 0 24px 0;">
      ${ctaButton({ text: `${returnLabel ?? "Reprendre mon compte"} →`, url: returnWithUtm, variant: "primary" })}
    </td>
  </tr>
</table>

${softBox(`
<p style="margin: 0 0 8px 0; color: ${BRAND.navy}; font-family: ${FONT}; font-size: 14px; font-weight: 600;">
  💬 Quelque chose ne va pas ?
</p>
<p style="margin: 0; color: ${BRAND.textBody}; font-family: ${FONT}; font-size: 13px; line-height: 22px;" class="nx-text-body">
  Si ${escapeHtml(productName)} ne répond pas à vos attentes, on aimerait comprendre pourquoi. Répondez simplement à cet email — nous lisons toutes les réponses.
</p>
<p style="margin: 12px 0 0 0; color: ${BRAND.textMuted}; font-family: ${FONT}; font-size: 13px; font-style: italic;">
  — ${escapeHtml(team)}
</p>`)}

<p style="margin: 16px 0 0 0; color: ${BRAND.textMuted}; font-family: ${FONT}; font-size: 12px; line-height: 20px; text-align: center; font-style: italic;">
  Si vous ne souhaitez plus recevoir ces emails, vous pouvez vous désabonner ci-dessous. Nous ne vous solliciterons plus.
</p>
`;

  // suppress unused import warning
  void paragraph;

  const html = renderBaseLayout({
    preheader,
    product,
    headerTag: "Vous nous manquez",
    heroIcon: { symbol: "👋", bg: BRAND.goldPale, fg: BRAND.navy },
    content: hero,
    unsubscribeUrl,
    footerVariant: "newsletter",
    preferencesUrl,
    subscriptionContext: `Vous recevez cet email car vous avez un compte ${productName}.`,
    unsubscribeLabel: "Se désabonner définitivement",
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
