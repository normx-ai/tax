// Template "Réinitialisation de mot de passe".
//
// Transactionnel critique : pas de lien de désinscription dans le footer
// (renderEmail le passe omis pour ce template).

import {
  BRAND,
  FONT,
  ctaButton,
  escapeHtml,
  highlightBox,
  paragraph,
  renderBaseLayout,
  type Product,
} from "../base.template";
import { addUtm } from "../utm";

const CAMPAIGN = "password-reset";

export interface PasswordResetVars {
  /** Produit qui demande la réinitialisation (Tax / Finance / Legal). Default: "tax". */
  product?: Product;
  userName: string;
  resetUrl: string; // lien magique signé (1 utilisation, expire vite)
  expiresInMinutes: number; // ex: 15
}

interface RenderedEmail {
  subject: string;
  html: string;
}

export function renderPasswordReset(vars: PasswordResetVars): RenderedEmail {
  const { product, userName, resetUrl, expiresInMinutes } = vars;
  const resetWithUtm = addUtm(resetUrl, { campaign: CAMPAIGN, content: "cta-reset" });

  const productName = (() => {
    switch (product) {
      case "finance": return "NORMX Finance";
      case "legal": return "NORMX Legal";
      default: return "NORMX Tax";
    }
  })();
  const subject = `Réinitialisation de votre mot de passe ${productName}`;
  const preheader = `Lien valable ${expiresInMinutes} minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`;

  const content = `
${paragraph(`Bonjour <strong style="color: ${BRAND.navy};">${escapeHtml(userName)}</strong>,`)}
${paragraph(
    `Vous avez demandé la réinitialisation de votre mot de passe ${escapeHtml(productName)}. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.`,
  )}

${highlightBox(`
<p style="margin: 0; color: ${BRAND.text}; font-family: ${FONT}; font-size: 14px; line-height: 22px;" class="nx-text">
  ⏱ Ce lien est valable <strong style="color: ${BRAND.navy};">${expiresInMinutes} minutes</strong> et ne peut être utilisé qu'une seule fois.
</p>`)}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding: 8px 0 24px 0;">
      ${ctaButton({ text: "Réinitialiser mon mot de passe →", url: resetWithUtm, variant: "primary" })}
    </td>
  </tr>
</table>

${paragraph(
    `Si vous n'êtes pas à l'origine de cette demande, ignorez cet email. Votre mot de passe restera inchangé. Pour signaler un usage frauduleux, contactez-nous à <a href="mailto:contact@normx-ai.com" style="color: ${BRAND.gold}; text-decoration: none; font-weight: 600;">contact@normx-ai.com</a>.`,
  )}
`;

  const html = renderBaseLayout({
    preheader,
    product,
    badge: { text: "Sécurité du compte", emoji: "🔐" },
    heading: "Réinitialisation de mot de passe",
    content,
    // Pas de unsubscribeUrl : transactionnel critique sécurité
  });

  return { subject, html };
}
