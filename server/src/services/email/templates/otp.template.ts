// Template "Code de vérification" (OTP / 2FA).
//
// Visuel : header navy avec tag "🔒 Sécurité", logo "NORMX AI" (umbrella
// brand pour tous les produits via Keycloak SSO). Cercle or pâle bordé
// avec emoji 🔐. Heading center "Code de vérification". Encadré or
// dégradé avec le code en monospace letter-spacing élevé. Encadré ambre
// d'avertissement sécurité. Encadré gris des détails de connexion (date,
// IP/géoloc, user-agent). Pas de désinscription (transactionnel critique).

import {
  BRAND,
  FONT,
  detailsBox,
  escapeHtml,
  paragraph,
  renderBaseLayout,
  warningBox,
  type Product,
} from "../base.template";

export interface OtpVars {
  /** Produit qui demande l'OTP. Default: "auth" (umbrella NORMX AI). */
  product?: Product;
  /** Code OTP — typiquement 6 chiffres */
  otpCode: string;
  /** Validité du code en minutes — ex: 10 */
  expiryMinutes: number;
  /** Date / heure de la tentative (ISO) — ex: pour audit */
  requestDate: string;
  /** Localisation IP — ex: "Paris, France · 78.193.x.x" */
  ipLocation: string;
  /** User-agent abrégé — ex: "Chrome 132 sur macOS" */
  userAgent: string;
  /** Prénom optionnel — laissé vide pour l'OTP de connexion anonyme */
  userName?: string;
}

interface RenderedEmail {
  subject: string;
  html: string;
}

export function renderOtp(vars: OtpVars): RenderedEmail {
  const { product = "auth", otpCode, expiryMinutes, requestDate, ipLocation, userAgent, userName } =
    vars;

  const subject = `Votre code de vérification NORMX AI`;
  const preheader = `Code valable ${expiryMinutes} minutes. Ne le partagez jamais.`;

  const greeting = userName
    ? `Bonjour <strong style="color: ${BRAND.navy};">${escapeHtml(userName)}</strong>,`
    : "Bonjour,";

  const content = `
${paragraph(`${greeting} voici votre code pour sécuriser votre connexion à votre espace NORMX AI.`)}

${otpCodeBox(otpCode, expiryMinutes)}

${warningBox(
    "⚠ Si vous n'êtes pas à l'origine de cette demande",
    `&bull; Ignorez simplement ce message<br/>
     &bull; Ne partagez <strong>jamais</strong> ce code avec qui que ce soit<br/>
     &bull; NORMX AI ne vous demandera jamais ce code par téléphone ou email`,
  )}

${detailsBox("Détails de la tentative", [
    { icon: "📅", label: formatDateTime(requestDate) },
    { icon: "🌍", label: ipLocation },
    { icon: "💻", label: userAgent },
  ])}
`;

  const html = renderBaseLayout({
    preheader,
    product,
    headerTag: "🔒 Sécurité",
    heroIcon: { symbol: "🔐", bg: BRAND.goldPale, fg: BRAND.navy, borderColor: BRAND.gold },
    heading: "Code de vérification",
    headingAlign: "center",
    content,
    // Pas de unsubscribeUrl : transactionnel critique sécurité, non désinscriptible
  });

  return { subject, html };
}

// -----------------------------------------------------------------------------
// Encadré dégradé or pâle pour le code OTP avec letter-spacing élevé,
// monospace et indication de validité.
// -----------------------------------------------------------------------------

function otpCodeBox(otpCode: string, expiryMinutes: number): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="nx-pale-bg nx-pale-border" style="background: linear-gradient(135deg, ${BRAND.goldPale} 0%, #FFF5D6 100%); background-color: ${BRAND.goldPale}; border: 2px dashed ${BRAND.gold}; border-radius: 12px; margin: 0 0 24px 0;">
  <tr>
    <td align="center" style="padding: 32px 24px;">
      <p style="margin: 0 0 12px 0; color: ${BRAND.textMuted}; font-family: ${FONT}; font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">
        Votre code
      </p>
      <p style="margin: 0; color: ${BRAND.navy}; font-family: 'Courier New', 'SF Mono', Consolas, monospace; font-size: 42px; font-weight: 700; letter-spacing: 8px;">
        ${escapeHtml(otpCode)}
      </p>
      <p style="margin: 16px 0 0 0; color: ${BRAND.textMuted}; font-family: ${FONT}; font-size: 12px;">
        ⏱ Valable <strong style="color: ${BRAND.navy};">${expiryMinutes} minutes</strong>
      </p>
    </td>
  </tr>
</table>`;
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
