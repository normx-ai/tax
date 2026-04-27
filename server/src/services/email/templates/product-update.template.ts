// Template "Annonce de fonctionnalité / product update".
//
// Visuel : header navy + tag "Product update". Pill or dégradé
// "✨ Nouveau". H1 32px feature name (centered). Tagline (centered).
// Visual placeholder (encadré or pâle dégradé avec emoji 64px ou image).
// Description : H3 navy + paragraphe. Use cases : "Concrètement vous
// pouvez :" + 3 numberedSteps style 'circle-small' (rond 24×24 or +
// description). Bloc tipCard navy "🎯 Disponibilité" (sans titre H2).
// Double CTA : "Essayer maintenant →" (primary) + "En savoir plus"
// (outline). softBox roadmap "🗺 Et bientôt sur NORMX" + lien.
//
// Footer variant 'newsletter' avec subscriptionContext personnalisé
// ("...mises à jour produit" — RGPD : intérêt légitime pour les
// utilisateurs concernés par la fonctionnalité, art. L.34-5 CPCE).

import {
  BRAND,
  FONT,
  ctaButton,
  ctaButtonPair,
  escapeHtml,
  numberedSteps,
  paragraph,
  pillBadge,
  renderBaseLayout,
  softBox,
  tipCard,
  visualPlaceholder,
  type Product,
} from "../base.template";
import { addUtm } from "../utm";

const CAMPAIGN = "product-update";

export interface ProductUpdateVars {
  /** Produit qui annonce la fonctionnalité. Default: "tax". */
  product?: Product;

  // Hero
  /** Nom de la fonctionnalité — H1 32px ex: "Agent IA Liasse Fiscale" */
  featureName: string;
  /** Tagline sous le H1 — phrase d'accroche courte */
  featureTagline: string;
  /** Texte du pill badge — default "Nouveau" (l'emoji ✨ est ajouté auto) */
  badgeText?: string;

  // Visual placeholder
  /** Emoji 64px illustrant la fonctionnalité (si pas d'image) — ex: "🤖" */
  featureEmoji?: string;
  /** Caption italic sous l'emoji */
  featureCaption?: string;
  /** URL d'une image hébergée (max 500px wide). Remplace l'emoji si fournie. */
  featureImageUrl?: string;

  // Description
  /** Sous-titre H3 navy au-dessus de la description longue */
  featureSubtitle: string;
  /** Description détaillée de la fonctionnalité (paragraphe) */
  featureDescription: string;

  // Use cases
  /** 3 cas d'usage concrets (rendus en numberedSteps style circle-small) */
  useCases: string[];

  // Disponibilité
  /** Texte du bloc navy "🎯 Disponibilité" — ex: "Disponible dès aujourd'hui pour tous les abonnés Pro et Enterprise." */
  availability: string;

  // CTAs
  /** Lien CTA primaire (ouvrir / essayer la fonctionnalité) */
  tryUrl: string;
  /** Texte CTA primaire — default "Essayer maintenant" */
  tryLabel?: string;
  /** Lien doc / article de blog "en savoir plus" */
  learnMoreUrl: string;
  /** Texte CTA secondaire — default "En savoir plus" */
  learnMoreLabel?: string;

  // Roadmap teaser
  /** Texte du bloc "🗺 Et bientôt" — ex: "Génération automatique des liasses fiscales, intégration Excel..." */
  nextFeatures: string;
  /** Lien vers la roadmap publique */
  roadmapUrl: string;

  // Footer
  unsubscribeUrl: string;
  preferencesUrl: string;
}

interface RenderedEmail {
  subject: string;
  html: string;
}

export function renderProductUpdate(vars: ProductUpdateVars): RenderedEmail {
  const {
    product,
    featureName,
    featureTagline,
    badgeText,
    featureEmoji,
    featureCaption,
    featureImageUrl,
    featureSubtitle,
    featureDescription,
    useCases,
    availability,
    tryUrl,
    tryLabel,
    learnMoreUrl,
    learnMoreLabel,
    nextFeatures,
    roadmapUrl,
    unsubscribeUrl,
    preferencesUrl,
  } = vars;

  const tryWithUtm = addUtm(tryUrl, { campaign: CAMPAIGN, content: "cta-try" });
  const learnMoreWithUtm = addUtm(learnMoreUrl, { campaign: CAMPAIGN, content: "cta-learn-more" });
  const roadmapWithUtm = addUtm(roadmapUrl, { campaign: CAMPAIGN, content: "cta-roadmap" });

  const subject = `Nouveau : ${featureName}`;
  const preheader = featureTagline.slice(0, 140);

  // --------------------------------------------------------------------------
  // Hero édito : pill badge + H1 + tagline (centered)
  // --------------------------------------------------------------------------
  const hero = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding: 0 0 16px 0;">
      ${pillBadge({ text: badgeText ?? "Nouveau", emoji: "✨" })}
    </td>
  </tr>
  <tr>
    <td align="center">
      <h1 class="nx-h1 nx-text" style="margin: 0; font-family: ${FONT}; font-size: 32px; font-weight: 700; line-height: 38px; letter-spacing: -0.8px; color: ${BRAND.navy};">
        ${escapeHtml(featureName)}
      </h1>
      <p class="nx-text-body" style="margin: 16px 0 32px 0; font-family: ${FONT}; font-size: 16px; line-height: 26px; color: ${BRAND.textBody};">
        ${escapeHtml(featureTagline)}
      </p>
    </td>
  </tr>
</table>

${visualPlaceholder({
  emoji: featureEmoji,
  caption: featureCaption,
  imageUrl: featureImageUrl,
  imageAlt: featureName,
})}

<p style="margin: 0 0 16px 0; color: ${BRAND.navy}; font-family: ${FONT}; font-size: 18px; font-weight: 700; line-height: 26px;">
  ${escapeHtml(featureSubtitle)}
</p>
${paragraph(featureDescription)}

<p style="margin: 24px 0 16px 0; color: ${BRAND.navy}; font-family: ${FONT}; font-size: 14px; font-weight: 600;">
  Concrètement, vous pouvez :
</p>
${numberedSteps(
  useCases.map((u) => ({ description: u })),
  { style: "circle-small" },
)}

${tipCard({
  eyebrow: "🎯 Disponibilité",
  content: availability,
})}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding: 8px 0 24px 0;">
      ${ctaButtonPair(
        { text: `${tryLabel ?? "Essayer maintenant"} →`, url: tryWithUtm },
        { text: learnMoreLabel ?? "En savoir plus", url: learnMoreWithUtm },
      )}
    </td>
  </tr>
</table>

${softBox(`
<p style="margin: 0 0 8px 0; color: ${BRAND.navy}; font-family: ${FONT}; font-size: 13px; font-weight: 600;">
  🗺 Et bientôt
</p>
<p style="margin: 0 0 12px 0; color: ${BRAND.textBody}; font-family: ${FONT}; font-size: 13px; line-height: 22px;" class="nx-text-body">
  ${escapeHtml(nextFeatures)}
</p>
<a href="${escapeHtml(roadmapWithUtm)}" style="color: ${BRAND.gold}; font-family: ${FONT}; font-size: 13px; font-weight: 600; text-decoration: none;">
  Voir la roadmap complète →
</a>`)}
`;

  // suppress unused import warning
  void ctaButton;

  const html = renderBaseLayout({
    preheader,
    product,
    headerTag: "Product update",
    content: hero,
    unsubscribeUrl,
    footerVariant: "newsletter",
    preferencesUrl,
    // RGPD : interet legitime pour les utilisateurs concernes par la
    // fonctionnalite (art. L.34-5 CPCE). Le footer mentionne explicitement
    // que c'est un email de mises a jour produit.
    subscriptionContext:
      "Vous recevez cet email car vous êtes utilisateur ou abonné aux mises à jour produit NORMX.",
  });

  return { subject, html };
}
