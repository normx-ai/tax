// Template "Newsletter mensuelle" — contenu marketing/édito.
//
// Visuel : header navy + tag "Newsletter · {monthYear}". Hero édito
// (pas de hero icon centré) : eyebrow or "Édition de {monthName}", H1
// éditorial 32px, intro. Featured card (encadré dégradé or pâle).
// Section "⚖ Actualités" (sectionTitle underlined or) + 3 newsItem.
// Section "📊 Chiffres" + 3 statsRow. tipCard navy "💡 L'astuce du
// mois". CTA primary "Ouvrir NORMX <Produit> →". Footer variant
// 'newsletter' avec Se désabonner / Préférences / Confidentialité.

import {
  BRAND,
  FONT,
  ctaButton,
  escapeHtml,
  eyebrow,
  featuredCard,
  getProductDisplayName,
  newsItem,
  renderBaseLayout,
  sectionTitle,
  statsRow,
  tipCard,
  type Product,
} from "../base.template";
import { addUtm } from "../utm";

const CAMPAIGN = "newsletter";

export interface NewsletterArticle {
  /** Catégorie courte affichée en eyebrow gris foncé small caps — ex: "Loi de finances" */
  category: string;
  /** Titre de l'article (lien) */
  title: string;
  /** Lien vers l'article */
  url: string;
  /** Court résumé / chapô — 1-2 phrases */
  excerpt: string;
}

export interface NewsletterStat {
  /** Valeur affichée en grand or — ex: "47" / "2,3 M€" / "+15 %" */
  value: string;
  /** Label small caps sous la valeur — ex: "Articles publiés" */
  label: string;
}

export interface NewsletterVars {
  /** Produit éditeur (Tax / Finance / Legal). Default: "tax". */
  product?: Product;

  // Bandeau supérieur du header et hero édito
  /** Mois + année dans le tag header — ex: "Janvier 2026" */
  monthYear: string;
  /** Mois seul affiché en eyebrow au-dessus du H1 — ex: "Janvier" */
  monthName: string;
  /** Titre éditorial du mois — H1 32px */
  newsletterTitle: string;
  /** Paragraphe d'introduction sous le H1 */
  newsletterIntro: string;

  // Section "À la une"
  featured: {
    title: string;
    excerpt: string;
    url: string;
    /** Texte du lien — default "Lire l'article complet →" */
    linkText?: string;
  };

  // Section "Actualités"
  /** Libellé de la section — default "⚖ Actualités fiscales OHADA" pour Tax */
  newsSectionTitle?: string;
  news: NewsletterArticle[];

  // Section "Chiffres"
  /** Libellé de la section — default "📊 NORMX <Produit> en chiffres" */
  statsSectionTitle?: string;
  /** Exactement 3 stats côte à côte */
  stats: [NewsletterStat, NewsletterStat, NewsletterStat];

  // Section "Astuce du mois"
  tip: { title: string; content: string };

  // Footer + CTA
  /** Lien CTA principal — généralement vers le dashboard */
  appUrl: string;
  /** Texte CTA — default "Ouvrir NORMX <Produit> →" */
  appCtaText?: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
  /** Nom de la newsletter affiché dans le footer — default "newsletter NORMX <Produit>" */
  newsletterName?: string;
}

interface RenderedEmail {
  subject: string;
  html: string;
}

export function renderNewsletter(vars: NewsletterVars): RenderedEmail {
  const {
    product,
    monthYear,
    monthName,
    newsletterTitle,
    newsletterIntro,
    featured,
    newsSectionTitle,
    news,
    statsSectionTitle,
    stats,
    tip,
    appUrl,
    appCtaText,
    unsubscribeUrl,
    preferencesUrl,
    newsletterName,
  } = vars;

  const productName = getProductDisplayName(product);
  const appUrlWithUtm = addUtm(appUrl, { campaign: `${CAMPAIGN}-${monthYear.toLowerCase().replace(/\s+/g, "-")}`, content: "cta-app" });
  const featuredUrlWithUtm = addUtm(featured.url, { campaign: `${CAMPAIGN}-${monthYear.toLowerCase().replace(/\s+/g, "-")}`, content: "cta-featured" });

  const subject = `${productName} — ${newsletterTitle}`;
  const preheader = newsletterIntro.slice(0, 140);

  // --------------------------------------------------------------------------
  // Hero édito (pas de hero icon, le base layout skip heading puisque
  // l'édito a son propre H1 personnalisé avec eyebrow + intro).
  // --------------------------------------------------------------------------
  const heroEdito = `
${eyebrow(`Édition de ${monthName}`, "gold")}
<h1 class="nx-h1 nx-text" style="margin: 0; font-family: ${FONT}; font-size: 32px; font-weight: 700; line-height: 38px; letter-spacing: -0.5px; color: ${BRAND.navy};">
  ${escapeHtml(newsletterTitle)}
</h1>
<p class="nx-text-body" style="margin: 16px 0 32px 0; font-family: ${FONT}; font-size: 15px; line-height: 24px; color: ${BRAND.textBody};">
  ${escapeHtml(newsletterIntro)}
</p>`;

  // --------------------------------------------------------------------------
  // Sections : featured / actualités / stats / astuce / CTA
  // --------------------------------------------------------------------------
  const featuredSection = featuredCard({
    eyebrow: "📌 À la une",
    title: featured.title,
    excerpt: featured.excerpt,
    linkUrl: featuredUrlWithUtm,
    linkText: featured.linkText,
  });

  const newsTitle = newsSectionTitle ?? "⚖ Actualités fiscales OHADA";
  const newsSection = `
<div style="margin-top: 32px;">
  ${sectionTitle(newsTitle)}
  ${news
    .map((n, i) =>
      newsItem({
        category: n.category,
        title: n.title,
        url: addUtm(n.url, { campaign: CAMPAIGN, content: `news-${i + 1}` }),
        excerpt: n.excerpt,
        isLast: i === news.length - 1,
      }),
    )
    .join("")}
</div>`;

  const statsTitle = statsSectionTitle ?? `📊 ${productName} en chiffres`;
  const statsSection = `
<div style="margin-top: 32px;">
  ${sectionTitle(statsTitle)}
  ${statsRow(stats)}
</div>`;

  const tipSection = tipCard({
    eyebrow: "💡 L'astuce du mois",
    title: tip.title,
    content: tip.content,
  });

  const cta = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding: 8px 0 0 0;">
      ${ctaButton({ text: appCtaText ?? `Ouvrir ${productName} →`, url: appUrlWithUtm, variant: "primary" })}
    </td>
  </tr>
</table>`;

  const content = `${heroEdito}${featuredSection}${newsSection}${statsSection}${tipSection}${cta}`;

  const html = renderBaseLayout({
    preheader,
    product,
    headerTag: `Newsletter · ${monthYear}`,
    // Heading omis : l'édito a son propre H1 dans le content
    content,
    unsubscribeUrl,
    footerVariant: "newsletter",
    preferencesUrl,
    newsletterName,
  });

  return { subject, html };
}
