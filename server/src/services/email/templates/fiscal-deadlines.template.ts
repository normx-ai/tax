// Template "Rappel d'échéances fiscales".
//
// Visuel : header navy NORMX Tax + badge or "Rappel d'échéances", liste
// des échéances dans un encadré or pâle (titre + articles + chip J-X coloré
// selon urgence), CTA or "Consulter mes échéances", encadré "Besoin d'aide"
// avec mention des agents IA NORMX Tax.

import {
  BRAND,
  FONT,
  ctaButton,
  escapeHtml,
  paragraph,
  renderBaseLayout,
  softBox,
  type Product,
} from "../base.template";
import { addUtm } from "../utm";

const CAMPAIGN = "fiscal-deadlines";

export interface FiscalDeadline {
  /** Libellé de l'échéance — ex: "Contribution foncière (CFPB/CFPNB)" */
  name: string;
  /** Articles CGI applicables — ex: ["Art. 271", "Art. 272"] */
  articles: string[];
  /** Date d'échéance ISO (YYYY-MM-DD) */
  dueDate: string;
}

export interface FiscalDeadlinesVars {
  /** Produit émetteur — par défaut "tax" (NORMX Tax émet les rappels d'échéances fiscales) */
  product?: Product;
  /** Prénom du destinataire */
  userName: string;
  /** Nombre de jours jusqu'à la première échéance — ex: 7 */
  daysUntilDeadline: number;
  /** Liste des échéances à venir, triée par date ascendante */
  deadlines: FiscalDeadline[];
  /** Lien profond vers la page échéances */
  dashboardUrl: string;
  /** Lien de désinscription (1-clic) */
  unsubscribeUrl: string;
}

interface RenderedEmail {
  subject: string;
  html: string;
}

export function renderFiscalDeadlines(vars: FiscalDeadlinesVars): RenderedEmail {
  const { product, userName, daysUntilDeadline, deadlines, dashboardUrl, unsubscribeUrl } = vars;
  const count = deadlines.length;
  const dashboardWithUtm = addUtm(dashboardUrl, { campaign: CAMPAIGN, content: "cta-primary" });

  const subject = `${count} échéance${count > 1 ? "s" : ""} fiscale${count > 1 ? "s" : ""} dans ${daysUntilDeadline} jour${daysUntilDeadline > 1 ? "s" : ""}`;
  const preheader = `Préparez vos déclarations : ${deadlines
    .slice(0, 2)
    .map((d) => d.name)
    .join(", ")}${count > 2 ? `, +${count - 2}` : ""}.`;

  const intro = `
${paragraph(`Bonjour <strong style="color: ${BRAND.navy};">${escapeHtml(userName)}</strong>,`)}
${paragraph(
    `Les échéances fiscales suivantes arrivent dans les <strong style="color: ${BRAND.navy};">${daysUntilDeadline} prochains jours</strong>. Préparez vos déclarations et vos paiements en avance pour éviter les pénalités.`,
  )}
`;

  const list = renderDeadlinesList(deadlines);

  const cta = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding: 8px 0 24px 0;">
      ${ctaButton({ text: "Consulter mes échéances →", url: dashboardWithUtm, variant: "primary" })}
    </td>
  </tr>
</table>`;

  const help = softBox(`
<p style="margin: 0; font-family: ${FONT}; font-size: 14px; font-weight: 600; color: ${BRAND.navy};">
  💡 Besoin d'aide pour vos déclarations ?
</p>
<p style="margin: 8px 0 0 0; font-family: ${FONT}; font-size: 13px; line-height: 22px; color: ${BRAND.textBody};" class="nx-text-body">
  Les agents IA de NORMX Tax interprètent chaque article du CGI applicable à votre situation et vous accompagnent dans la préparation de vos déclarations.
</p>`);

  const html = renderBaseLayout({
    preheader,
    product,
    badge: { text: "Rappel d'échéances", emoji: "⏰" },
    heading: "Échéances fiscales à venir",
    content: `${intro}${list}${cta}${help}`,
    unsubscribeUrl,
  });

  return { subject, html };
}

// -----------------------------------------------------------------------------
// Rendu de la liste des échéances : un tableau avec un row par deadline,
// chip J-X colorée selon l'urgence (rouge ≤3j, or ≤7j, navy au-delà).
// -----------------------------------------------------------------------------

function renderDeadlinesList(deadlines: FiscalDeadline[]): string {
  const rows = deadlines.map((d, i) => renderDeadlineRow(d, i === deadlines.length - 1)).join("");

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="nx-pale-bg nx-pale-border" style="background-color: ${BRAND.goldPale}; border: 1px solid ${BRAND.goldBorder}; border-radius: 8px; margin: 0 0 24px 0;">
  ${rows}
</table>`;
}

function renderDeadlineRow(d: FiscalDeadline, isLast: boolean): string {
  const days = daysUntil(d.dueDate);
  const chip = renderUrgencyChip(days);
  const articles = d.articles.length > 0 ? escapeHtml(d.articles.join(", ")) : "";
  const articlesLine = articles
    ? `<p style="margin: 4px 0 0 0; color: ${BRAND.textMuted}; font-family: ${FONT}; font-size: 13px;">${articles} du CGI</p>`
    : "";
  const borderBottom = isLast ? "" : `border-bottom: 1px solid ${BRAND.goldBorder};`;

  return `
  <tr>
    <td style="padding: 20px 24px; ${borderBottom}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td valign="top">
            <p style="margin: 0; color: ${BRAND.navy}; font-family: ${FONT}; font-size: 15px; font-weight: 600; line-height: 22px;">
              ${escapeHtml(d.name)}
            </p>
            ${articlesLine}
            <p style="margin: 8px 0 0 0; color: ${BRAND.textMuted}; font-family: ${FONT}; font-size: 12px;">
              Échéance : ${escapeHtml(formatDate(d.dueDate))}
            </p>
          </td>
          <td valign="top" align="right" style="white-space: nowrap; padding-left: 16px;">
            ${chip}
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function renderUrgencyChip(days: number): string {
  // ≤ 3 jours : rouge urgent / ≤ 7 jours : or marque / > 7 jours : navy
  let bg: string;
  if (days <= 3) bg = "#DC2626";
  else if (days <= 7) bg = BRAND.gold;
  else bg = BRAND.navy;

  const label = days < 0 ? "EN RETARD" : days === 0 ? "AUJOURD'HUI" : `J-${days}`;

  return `<span style="display: inline-block; background-color: ${bg}; color: ${BRAND.white}; padding: 4px 10px; border-radius: 6px; font-family: ${FONT}; font-size: 12px; font-weight: 600; letter-spacing: 0.3px;">${label}</span>`;
}

// -----------------------------------------------------------------------------
// Utilitaires de date — pas de dépendance externe (Intl natif).
// -----------------------------------------------------------------------------

function daysUntil(dueDateIso: string): number {
  const due = new Date(`${dueDateIso}T00:00:00Z`);
  const now = new Date();
  // Calcul en jours UTC pour éviter les surprises de fuseau
  const utcNow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const utcDue = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  return Math.round((utcDue - utcNow) / 86_400_000);
}

function formatDate(dueDateIso: string): string {
  const d = new Date(`${dueDateIso}T00:00:00Z`);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Brazzaville",
  });
}
