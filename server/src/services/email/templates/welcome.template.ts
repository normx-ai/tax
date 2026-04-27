// Template "Bienvenue" — envoyé après une souscription réussie.

import {
  BRAND,
  FONT,
  ctaButton,
  escapeHtml,
  getProductDisplayName,
  paragraph,
  renderBaseLayout,
  softBox,
  type Product,
} from "../base.template";

// Pitch d'onboarding par produit. Un seul endroit à mettre à jour quand
// les fonctionnalités évoluent.
const WELCOME_PITCH: Record<Product, { features: string; quickStart: string }> = {
  tax: {
    features:
      "Vous avez accès à l'intégralité du CGI 2026 du Congo, aux simulateurs (ITS, IS, IBA, TVA, patente, paie), à l'agent IA fiscal et au calendrier des échéances avec rappels automatiques.",
    quickStart:
      "Renseignez votre première entité fiscale (régime IS/IBA, secteur, effectif) — NORMX Tax génère automatiquement vos obligations déclaratives et vos échéances.",
  },
  finance: {
    features:
      "Vous avez accès à la comptabilité OHADA SYSCOHADA, aux états financiers (bilan, compte de résultat, flux de trésorerie), aux 47 notes annexes, à la paie congolaise (CGI 2026, 16 conventions collectives) et à l'assistant IA comptable.",
    quickStart:
      "Importez votre balance ou créez votre premier exercice — NORMX Finance génère automatiquement vos états financiers et vos déclarations de paie.",
  },
  legal: {
    features:
      "Vous avez accès à la génération de documents juridiques OHADA (statuts, PV d'AG, cessions de parts, contrats), à la bibliothèque des Actes uniformes et aux modèles paramétrables par forme juridique (SARL, SAS, SA…).",
    quickStart:
      "Choisissez votre type de société et votre opération — NORMX Legal pré-remplit le document conformément aux exigences OHADA en vigueur.",
  },
};
import { addUtm } from "../utm";

const CAMPAIGN = "welcome";

export interface WelcomeVars {
  /** Produit qui souhaite la bienvenue (Tax / Finance / Legal). Default: "tax". */
  product?: Product;
  userName: string;
  organizationName: string;
  planName: string; // ex: "Pro", "Starter"
  dashboardUrl: string;
  unsubscribeUrl: string;
}

interface RenderedEmail {
  subject: string;
  html: string;
}

export function renderWelcome(vars: WelcomeVars): RenderedEmail {
  const { product, userName, organizationName, planName, dashboardUrl, unsubscribeUrl } = vars;
  const dashboardWithUtm = addUtm(dashboardUrl, { campaign: CAMPAIGN, content: "cta-primary" });
  const productName = getProductDisplayName(product);
  const pitch = WELCOME_PITCH[product ?? "tax"];

  const subject = `Bienvenue sur ${productName}, ${userName}`;
  const preheader = `Votre espace ${organizationName} (plan ${planName}) est prêt. Démarrez en 2 minutes.`;

  const content = `
${paragraph(`Bonjour <strong style="color: ${BRAND.navy};">${escapeHtml(userName)}</strong>,`)}
${paragraph(
    `Bienvenue sur ${escapeHtml(productName)}. Votre espace <strong style="color: ${BRAND.navy};">${escapeHtml(organizationName)}</strong> est désormais actif sur le plan <strong style="color: ${BRAND.navy};">${escapeHtml(planName)}</strong>.`,
  )}
${paragraph(pitch.features)}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding: 8px 0 24px 0;">
      ${ctaButton({ text: "Accéder à mon espace →", url: dashboardWithUtm, variant: "primary" })}
    </td>
  </tr>
</table>

${softBox(`
<p style="margin: 0; font-family: ${FONT}; font-size: 14px; font-weight: 600; color: ${BRAND.navy};">
  💡 Pour bien démarrer
</p>
<p style="margin: 8px 0 0 0; font-family: ${FONT}; font-size: 13px; line-height: 22px; color: ${BRAND.textBody};" class="nx-text-body">
  ${escapeHtml(pitch.quickStart)}
</p>`)}
`;

  const html = renderBaseLayout({
    preheader,
    product,
    badge: { text: "Bienvenue", emoji: "👋" },
    heading: `Votre espace ${productName} est prêt`,
    content,
    unsubscribeUrl,
  });

  return { subject, html };
}
