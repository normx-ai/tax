// Template "Bienvenue" — envoyé après une souscription réussie.
//
// Visuel : header navy NORMX <Produit>, hero rond or pâle 🎉,
// heading center "Bienvenue, <userName> !", sous-titre annonçant le plan
// activé. Trois étapes numérotées (numberedSteps) avec carrés or, CTA or
// "Accéder à mon tableau de bord", encadré aide avec lien support.

import {
  BRAND,
  FONT,
  ctaButton,
  escapeHtml,
  getProductDisplayName,
  numberedSteps,
  paragraph,
  renderBaseLayout,
  softBox,
  type Product,
} from "../base.template";
import { addUtm } from "../utm";

const CAMPAIGN = "welcome";

// 3 étapes d'onboarding par produit. Chaque produit a sa pédagogie.
type WelcomeProduct = Exclude<Product, "auth">;

interface OnboardingStep {
  title: string;
  description: string;
}

const WELCOME_STEPS: Record<WelcomeProduct, OnboardingStep[]> = {
  tax: [
    {
      title: "Posez vos questions fiscales",
      description:
        "44 agents IA spécialisés sur le CGI Congo, prêts à vous répondre avec les articles applicables.",
    },
    {
      title: "Utilisez les simulateurs",
      description:
        "ITS, IS, IBA, TVA, patente, paie : calculez vos impôts en quelques clics avec les barèmes 2026.",
    },
    {
      title: "Suivez vos échéances",
      description:
        "Recevez des alertes automatiques avant chaque deadline fiscale (Art. 461 bis : 15 du mois).",
    },
  ],
  finance: [
    {
      title: "Importez votre balance",
      description:
        "Plan comptable SYSCOHADA OHADA, journaux et écritures synchronisés avec votre comptabilité existante.",
    },
    {
      title: "Générez les états financiers",
      description:
        "Bilan, compte de résultat, flux de trésorerie et 47 notes annexes — conformes OHADA, prêts pour le greffe.",
    },
    {
      title: "Pilotez la paie congolaise",
      description:
        "Bulletins, déclarations CNSS/CAMU/ITS, 16 conventions collectives et CGI 2026 intégrés.",
    },
  ],
  legal: [
    {
      title: "Choisissez votre opération",
      description:
        "Statuts, PV d'AG, cessions de parts, contrats — tous les documents juridiques OHADA en un clic.",
    },
    {
      title: "Personnalisez le document",
      description:
        "Forme juridique (SARL, SAS, SA…), capital, associés, gérance : NORMX Legal pré-remplit tout.",
    },
    {
      title: "Téléchargez en .docx",
      description:
        "Document final aux normes OHADA, prêt pour signature et dépôt au greffe du commerce.",
    },
  ],
};

function resolveWelcomeProduct(product?: Product): WelcomeProduct {
  return product && product !== "auth" ? product : "tax";
}

export interface WelcomeVars {
  /** Produit qui souhaite la bienvenue (Tax / Finance / Legal). Default: "tax". */
  product?: Product;
  userName: string;
  planName: string; // ex: "Pro", "Starter"
  dashboardUrl: string;
  unsubscribeUrl: string;
  /** Email de support à afficher dans l'encadré aide — default: contact du produit */
  supportEmail?: string;
}

interface RenderedEmail {
  subject: string;
  html: string;
}

export function renderWelcome(vars: WelcomeVars): RenderedEmail {
  const { product, userName, planName, dashboardUrl, unsubscribeUrl, supportEmail } = vars;
  const dashboardWithUtm = addUtm(dashboardUrl, { campaign: CAMPAIGN, content: "cta-primary" });
  const productName = getProductDisplayName(product);
  const steps = WELCOME_STEPS[resolveWelcomeProduct(product)];
  const helpEmail = supportEmail ?? "support@normx-ai.com";

  const subject = `Bienvenue sur ${productName}, ${userName}`;
  const preheader = `Votre abonnement ${planName} est activé. Démarrez en 2 minutes.`;

  const content = `
${numberedSteps(steps)}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding: 0 0 24px 0;">
      ${ctaButton({ text: "Accéder à mon tableau de bord →", url: dashboardWithUtm, variant: "primary" })}
    </td>
  </tr>
</table>

${softBox(`
<p style="margin: 0; color: ${BRAND.navy}; font-family: ${FONT}; font-size: 14px; font-weight: 600;">
  💬 Une question ?
</p>
<p style="margin: 8px 0 0 0; color: ${BRAND.textBody}; font-family: ${FONT}; font-size: 13px; line-height: 22px;" class="nx-text-body">
  Notre équipe est là : <a href="mailto:${escapeHtml(helpEmail)}" style="color: ${BRAND.gold}; text-decoration: none; font-weight: 600;">${escapeHtml(helpEmail)}</a>
</p>`)}
`;

  // suppress unused import warning (paragraph kept for back-compat consumers)
  void paragraph;

  const html = renderBaseLayout({
    preheader,
    product,
    heroIcon: { symbol: "🎉", bg: BRAND.goldPale, fg: BRAND.navy },
    heading: `Bienvenue, ${userName} !`,
    headingAlign: "center",
    subheading: `Votre abonnement <strong style="color: ${BRAND.navy};">${escapeHtml(planName)}</strong> est activé. Vous avez maintenant accès à toute la puissance de ${escapeHtml(productName)}.`,
    content,
    unsubscribeUrl,
  });

  return { subject, html };
}
