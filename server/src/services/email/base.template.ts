// Layout de base partagé par tous les emails transactionnels NORMX Tax.
//
// Contraintes :
//  - Tableaux pour la mise en page (Outlook compat) — pas de flex/grid.
//  - CSS strictement inline sur chaque cellule visible.
//  - Largeur max 600px.
//  - prefers-color-scheme: dark -> overrides via <style> dans <head>.
//  - Logo géré côté email.service.ts (CID `normx-logo`) ou rendu textuel
//    "NORMX Tax" si pas de logo embarqué (ce layout privilégie le rendu
//    typographique pour rester lisible si l'image ne charge pas).
//  - Footer navy complet : NORMX AI SAS, CM2C, désinscription optionnelle,
//    liens CGV / Confidentialité / Mentions légales.

// Le module email est partagé par les 3 produits NORMX (Tax, Finance, Legal).
// Le paramètre `product` passé à renderBaseLayout pilote :
//   - le nom affiché dans le logo du header ("NORMX Tax" / "NORMX Finance" / "NORMX Legal")
//   - le tag par défaut à droite du logo
//   - le domaine du footer (CGV / Confidentialité / Mentions légales / lien marque)
// La société émettrice (NORMX AI SAS, RCS Amiens, CM2C) reste commune
// puisque les 3 produits sont édités par la même personne morale.

export type Product = "tax" | "finance" | "legal" | "auth";

interface ProductConfig {
  /** Nom affiché à droite du logo NORMX (en blanc light) */
  suffix: string;
  /** Tag par défaut à droite du header (small caps gold) */
  defaultTag: string;
  /** Base URL du produit (utilisé pour CGV/conf/mentions du footer) */
  baseUrl: string;
  /** Email contact pour le footer */
  contactEmail: string;
}

const PRODUCTS: Record<Product, ProductConfig> = {
  tax: {
    suffix: "Tax",
    defaultTag: "Intelligence Fiscale",
    baseUrl: "https://tax.normx-ai.com",
    contactEmail: "contact@normx-ai.com",
  },
  finance: {
    suffix: "Finance",
    defaultTag: "Comptabilité Augmentée",
    baseUrl: "https://app.normx-ai.com",
    contactEmail: "contact@normx-ai.com",
  },
  legal: {
    suffix: "Legal",
    defaultTag: "Documents Juridiques OHADA",
    baseUrl: "https://legal.normx-ai.com",
    contactEmail: "contact@normx-ai.com",
  },
  // Umbrella brand pour tous les emails de securite/auth (OTP, reset
  // mot de passe, MFA) — Keycloak SSO les emet pour le compte des 3
  // produits. Le logo affiche "NORMX AI" sans suffixe produit.
  auth: {
    suffix: "AI",
    defaultTag: "Sécurité",
    baseUrl: "https://normx-ai.com",
    contactEmail: "support@normx-ai.com",
  },
};

function resolveProduct(product?: Product): ProductConfig {
  return PRODUCTS[product ?? "tax"];
}

/** Nom complet à afficher dans un sujet ou un texte ("NORMX Tax" / "NORMX Finance" / "NORMX Legal"). */
export function getProductDisplayName(product?: Product): string {
  return `NORMX ${resolveProduct(product).suffix}`;
}

export const BRAND = {
  gold: "#D4A843",
  goldDark: "#C49A38",
  goldPale: "#FEF9EE",
  goldBorder: "#F0E4C8",
  navy: "#0F2A42",
  navyLight: "#1A3A5C",
  navySubtle: "#8A9CB1",
  navyDivider: "#1A3A5C",
  navyMuted: "#5A6B7F",
  white: "#FFFFFF",
  text: "#0F2A42",
  textBody: "#4A5568",
  textMuted: "#8B7C5A",
  border: "#E5E7EB",
  bgSoft: "#F8F9FB",
} as const;

const FONT_STACK = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

export interface BaseLayoutOptions {
  preheader: string; // texte d'aperçu (gris caché en haut, lu par Gmail/Apple Mail)
  /** Produit émetteur — pilote le nom dans le logo et les URLs du footer. Default: "tax". */
  product?: Product;
  /** Tag affiché à droite du logo dans le header. Default: tag du produit (ex: "Intelligence Fiscale"). */
  headerTag?: string;
  /** Badge or pâle latéral au-dessus du H1 (style fiscal-deadlines). Mutuellement exclusif avec heroIcon. */
  badge?: { text: string; emoji?: string };
  /**
   * Icône hero centrée au-dessus du H1.
   * - Style "filled" (✓ vert sur fond vert pâle) : { symbol: "✓", bg: "#DCFCE7", fg: "#16A34A" }
   * - Style "outlined" (🔐 sur fond or pâle bordé or) : ajouter borderColor: "#D4A843"
   */
  heroIcon?: { symbol: string; bg: string; fg: string; borderColor?: string };
  /** Titre H1. Optionnel : si omis, le content démarre directement après le header (newsletter / templates avec hero édito custom). */
  heading?: string;
  /** Alignement du H1 (et du subheading le cas échéant). Default: left. */
  headingAlign?: "left" | "center";
  /** Sous-titre optionnel sous le H1, plus petit. */
  subheading?: string;
  /** HTML du corps (sous le H1, jusqu'au footer). */
  content: string;
  /** Omis pour les transactionnels critiques (OTP, mot de passe, paiement). */
  unsubscribeUrl?: string;
  /**
   * "transactional" (default) : footer standard avec CGV / Confidentialité / Mentions légales.
   * "newsletter" : mention abonnement newsletter + Se désinscrire / Préférences / Confidentialité.
   * "marketing" : mention communications commerciales + Se désinscrire / CGV / Confidentialité.
   */
  footerVariant?: "transactional" | "newsletter" | "marketing";
  /** Lien préférences abonnements (uniquement footerVariant='newsletter'). */
  preferencesUrl?: string;
  /** Nom de la newsletter pour le texte du footer (ex: "newsletter NORMX Tax"). Default: dérivé du produit. */
  newsletterName?: string;
}

/**
 * Encadre un contenu avec le header navy, le corps blanc et le footer navy.
 * Retourne un document HTML complet (DOCTYPE + html), prêt à envoyer.
 */
export function renderBaseLayout(opts: BaseLayoutOptions): string {
  const {
    preheader,
    product,
    headerTag,
    badge,
    heroIcon,
    heading,
    headingAlign = "left",
    subheading,
    content,
    unsubscribeUrl,
    footerVariant = "transactional",
    preferencesUrl,
    newsletterName,
  } = opts;
  const productCfg = resolveProduct(product);
  const tag = headerTag ?? productCfg.defaultTag;

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${escapeHtml(heading ?? preheader)}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }

    @media (prefers-color-scheme: dark) {
      body, .nx-bg { background-color: #0a0a0a !important; }
      .nx-card { background-color: #161616 !important; }
      .nx-text { color: #e5e7eb !important; }
      .nx-text-body { color: #a1a1aa !important; }
      .nx-text-muted { color: #71717a !important; }
      .nx-pale-bg { background-color: rgba(212,168,67,0.10) !important; }
      .nx-pale-border { border-color: rgba(212,168,67,0.25) !important; }
      .nx-soft-bg { background-color: rgba(255,255,255,0.04) !important; }
    }

    @media only screen and (max-width: 600px) {
      .nx-container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; }
      .nx-px { padding-left: 24px !important; padding-right: 24px !important; }
      .nx-h1 { font-size: 22px !important; line-height: 30px !important; }
      .nx-header-tag { display: none !important; }
    }
  </style>
</head>
<body class="nx-bg" style="margin: 0; padding: 0; background-color: ${BRAND.goldPale}; font-family: ${FONT_STACK};">

  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all; visibility: hidden; opacity: 0; color: transparent; font-size: 1px; line-height: 1px;">
    ${escapeHtml(preheader)}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="nx-bg" style="background-color: ${BRAND.goldPale};">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="nx-container" style="width: 600px; max-width: 600px; background-color: ${BRAND.white}; border-radius: 12px; overflow: hidden;">
          ${headerSection(productCfg.suffix, tag)}
          ${heroIcon ? heroIconSection(heroIcon) : ""}
          ${badge ? badgeSection(badge) : ""}
          ${heading ? headingSection(heading, headingAlign, subheading) : ""}
          ${contentSection(content)}
          ${footerVariant === "newsletter"
            ? newsletterFooterSection(productCfg, { unsubscribeUrl, preferencesUrl, newsletterName })
            : footerVariant === "marketing"
              ? marketingFooterSection(productCfg, unsubscribeUrl)
              : footerSection(productCfg, unsubscribeUrl)}
        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

function headerSection(productSuffix: string, headerTag: string): string {
  return `
          <tr>
            <td class="nx-px" style="background: linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 100%); background-color: ${BRAND.navy}; padding: 32px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family: ${FONT_STACK}; font-size: 24px; line-height: 28px; letter-spacing: -0.5px;">
                    <span style="color: ${BRAND.gold}; font-weight: 700;">NORMX</span><span style="color: ${BRAND.white}; font-weight: 300;"> ${escapeHtml(productSuffix)}</span>
                  </td>
                  <td align="right" class="nx-header-tag" style="font-family: ${FONT_STACK}; font-size: 11px; font-weight: 500; letter-spacing: 1.2px; text-transform: uppercase; color: ${BRAND.gold};">
                    ${escapeHtml(headerTag)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}

function heroIconSection(icon: { symbol: string; bg: string; fg: string; borderColor?: string }): string {
  const border = icon.borderColor ? `border: 2px solid ${icon.borderColor};` : "";
  return `
          <tr>
            <td align="center" class="nx-px nx-card" style="background-color: ${BRAND.white}; padding: 48px 40px 16px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" valign="middle" width="72" height="72" style="background-color: ${icon.bg}; width: 72px; height: 72px; border-radius: 50%; mso-line-height-rule: exactly; line-height: 72px; ${border}">
                    <span style="display: inline-block; color: ${icon.fg}; font-family: ${FONT_STACK}; font-size: 32px; font-weight: 700; line-height: 72px;">${escapeHtml(icon.symbol)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}

function badgeSection({ text, emoji }: { text: string; emoji?: string }): string {
  return `
          <tr>
            <td class="nx-px" style="padding: 32px 40px 0 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="nx-pale-bg nx-pale-border" style="background-color: ${BRAND.goldPale}; border-left: 4px solid ${BRAND.gold}; padding: 8px 16px; border-radius: 4px; font-family: ${FONT_STACK}; font-size: 13px; font-weight: 600; color: ${BRAND.navy};">
                    ${emoji ? `<span style="margin-right: 6px;">${emoji}</span>` : ""}${escapeHtml(text)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}

function headingSection(heading: string, align: "left" | "center", subheading?: string): string {
  const sub = subheading
    ? `<p class="nx-text-body" style="margin: 8px 0 0 0; font-family: ${FONT_STACK}; font-size: 16px; line-height: 24px; color: ${BRAND.textBody};">${subheading}</p>`
    : "";
  return `
          <tr>
            <td align="${align}" class="nx-px nx-card" style="background-color: ${BRAND.white}; padding: 24px 40px 8px 40px;">
              <h1 class="nx-h1 nx-text" style="margin: 0; font-family: ${FONT_STACK}; font-size: 26px; font-weight: 700; line-height: 32px; letter-spacing: -0.5px; color: ${BRAND.navy};">
                ${escapeHtml(heading)}
              </h1>
              ${sub}
            </td>
          </tr>`;
}

function contentSection(content: string): string {
  return `
          <tr>
            <td class="nx-px nx-card" style="background-color: ${BRAND.white}; padding: 8px 40px 32px 40px;">
              ${content}
            </td>
          </tr>`;
}

function marketingFooterSection(productCfg: ProductConfig, unsubscribeUrl?: string): string {
  const cgvUrl = `${productCfg.baseUrl}/cgv`;
  const privacyUrl = `${productCfg.baseUrl}/confidentialite`;
  const productHost = productCfg.baseUrl.replace(/^https?:\/\//, "");
  const unsub = unsubscribeUrl
    ? `<a href="${escapeAttr(unsubscribeUrl)}" style="color: ${BRAND.navySubtle}; text-decoration: underline;">Se désabonner</a> &middot; `
    : "";

  return `
          <tr>
            <td class="nx-px" style="background-color: ${BRAND.navy}; padding: 32px 40px; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 12px 0; color: ${BRAND.gold}; font-family: ${FONT_STACK}; font-size: 14px; font-weight: 600;">NORMX AI SAS</p>
              <p style="margin: 0; color: ${BRAND.navySubtle}; font-family: ${FONT_STACK}; font-size: 12px; line-height: 20px;">
                71 rue Daire, 80000 Amiens &mdash; RCS Amiens 103 831 921<br/>
                <a href="${productCfg.baseUrl}" style="color: ${BRAND.gold}; text-decoration: none;">${escapeHtml(productHost)}</a>
                &middot;
                <a href="mailto:${escapeAttr(productCfg.contactEmail)}" style="color: ${BRAND.gold}; text-decoration: none;">${escapeHtml(productCfg.contactEmail)}</a>
              </p>
              <p style="margin: 16px 0 0 0; padding-top: 16px; border-top: 1px solid ${BRAND.navyDivider}; color: ${BRAND.navyMuted}; font-family: ${FONT_STACK}; font-size: 11px; line-height: 18px;">
                Vous recevez cet email car vous êtes inscrit aux communications commerciales NORMX ${productCfg.suffix}.<br/>
                ${unsub}<a href="${cgvUrl}" style="color: ${BRAND.navySubtle}; text-decoration: underline;">CGV</a>
                &middot;
                <a href="${privacyUrl}" style="color: ${BRAND.navySubtle}; text-decoration: underline;">Confidentialité</a>
              </p>
            </td>
          </tr>`;
}

function newsletterFooterSection(
  productCfg: ProductConfig,
  opts: { unsubscribeUrl?: string; preferencesUrl?: string; newsletterName?: string },
): string {
  const privacyUrl = `${productCfg.baseUrl}/confidentialite`;
  const productHost = productCfg.baseUrl.replace(/^https?:\/\//, "");
  const newsletterName = opts.newsletterName ?? `newsletter NORMX ${productCfg.suffix}`;
  const unsub = opts.unsubscribeUrl
    ? `<a href="${escapeAttr(opts.unsubscribeUrl)}" style="color: ${BRAND.navySubtle}; text-decoration: underline;">Se désabonner</a>`
    : "";
  const prefs = opts.preferencesUrl
    ? `<a href="${escapeAttr(opts.preferencesUrl)}" style="color: ${BRAND.navySubtle}; text-decoration: underline;">Préférences</a>`
    : "";
  const links = [unsub, prefs, `<a href="${privacyUrl}" style="color: ${BRAND.navySubtle}; text-decoration: underline;">Confidentialité</a>`]
    .filter(Boolean)
    .join(" &middot; ");

  return `
          <tr>
            <td class="nx-px" style="background-color: ${BRAND.navy}; padding: 32px 40px; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 12px 0; color: ${BRAND.gold}; font-family: ${FONT_STACK}; font-size: 14px; font-weight: 600;">NORMX AI SAS</p>
              <p style="margin: 0; color: ${BRAND.navySubtle}; font-family: ${FONT_STACK}; font-size: 12px; line-height: 20px;">
                71 rue Daire, 80000 Amiens &mdash; RCS Amiens 103 831 921<br/>
                <a href="${productCfg.baseUrl}" style="color: ${BRAND.gold}; text-decoration: none;">${escapeHtml(productHost)}</a>
                &middot;
                <a href="mailto:${escapeAttr(productCfg.contactEmail)}" style="color: ${BRAND.gold}; text-decoration: none;">${escapeHtml(productCfg.contactEmail)}</a>
              </p>
              <p style="margin: 16px 0 0 0; padding-top: 16px; border-top: 1px solid ${BRAND.navyDivider}; color: ${BRAND.navyMuted}; font-family: ${FONT_STACK}; font-size: 11px; line-height: 18px;">
                Vous recevez cet email car vous êtes abonné à la ${escapeHtml(newsletterName)}.<br/>
                ${links}
              </p>
            </td>
          </tr>`;
}

function footerSection(productCfg: ProductConfig, unsubscribeUrl?: string): string {
  const cgvUrl = `${productCfg.baseUrl}/cgv`;
  const privacyUrl = `${productCfg.baseUrl}/confidentialite`;
  const legalUrl = `${productCfg.baseUrl}/mentions-legales`;
  const productHost = productCfg.baseUrl.replace(/^https?:\/\//, "");
  const unsubscribeBlock = unsubscribeUrl
    ? `<a href="${escapeAttr(unsubscribeUrl)}" style="color: ${BRAND.navySubtle}; text-decoration: underline;">Se désinscrire</a>
       &middot;
      `
    : "";

  return `
          <tr>
            <td class="nx-px" style="background-color: ${BRAND.navy}; padding: 32px 40px; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 12px 0; color: ${BRAND.gold}; font-family: ${FONT_STACK}; font-size: 14px; font-weight: 600;">NORMX AI SAS</p>
              <p style="margin: 0; color: ${BRAND.navySubtle}; font-family: ${FONT_STACK}; font-size: 12px; line-height: 20px;">
                SAS au capital de 1 000 EUR &mdash; 71 rue Daire, 80000 Amiens<br/>
                SIRET 103 831 921 00012 &mdash; RCS Amiens<br/>
                <a href="${productCfg.baseUrl}" style="color: ${BRAND.gold}; text-decoration: none;">${escapeHtml(productHost)}</a>
                &middot;
                <a href="mailto:${escapeAttr(productCfg.contactEmail)}" style="color: ${BRAND.gold}; text-decoration: none;">${escapeHtml(productCfg.contactEmail)}</a>
              </p>
              <p style="margin: 16px 0 0 0; padding-top: 16px; border-top: 1px solid ${BRAND.navyDivider}; color: ${BRAND.navyMuted}; font-family: ${FONT_STACK}; font-size: 11px; line-height: 18px;">
                Médiateur de la consommation : CM2C &mdash;
                <a href="https://www.cm2c.net" style="color: ${BRAND.navySubtle}; text-decoration: underline;">www.cm2c.net</a><br/>
                ${unsubscribeBlock}<a href="${cgvUrl}" style="color: ${BRAND.navySubtle}; text-decoration: underline;">CGV</a>
                &middot;
                <a href="${privacyUrl}" style="color: ${BRAND.navySubtle}; text-decoration: underline;">Politique de confidentialité</a>
                &middot;
                <a href="${legalUrl}" style="color: ${BRAND.navySubtle}; text-decoration: underline;">Mentions légales</a>
              </p>
              <p style="margin: 12px 0 0 0; color: ${BRAND.navyMuted}; font-family: ${FONT_STACK}; font-size: 11px; line-height: 16px;">
                &copy; ${new Date().getFullYear()} NORMX AI &mdash; Tous droits réservés
              </p>
            </td>
          </tr>`;
}

// =============================================================================
// Helpers réutilisables par les templates concrets
// =============================================================================

interface CtaButtonOptions {
  text: string;
  url: string;
  /**
   * primary = or plein (CTA principal)
   * secondary = navy plein (CTA alternatif)
   * outline = bordé or, fond blanc (CTA secondaire à côté d'un primary)
   */
  variant?: "primary" | "secondary" | "outline";
}

/**
 * Bouton CTA aux couleurs de marque. Compatible Outlook (mso-padding-alt
 * + bgcolor pour les versions Word qui ignorent les CSS).
 */
export function ctaButton({ text, url, variant = "primary" }: CtaButtonOptions): string {
  if (variant === "outline") {
    return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
  <tr>
    <td align="center" bgcolor="${BRAND.white}" style="background-color: ${BRAND.white}; border: 2px solid ${BRAND.gold}; border-radius: 8px; mso-padding-alt: 12px 22px;">
      <a href="${escapeAttr(url)}" target="_blank" style="display: inline-block; padding: 12px 22px; font-family: ${FONT_STACK}; font-size: 14px; font-weight: 600; line-height: 20px; color: ${BRAND.gold}; text-decoration: none; letter-spacing: 0.3px;">
        ${escapeHtml(text)}
      </a>
    </td>
  </tr>
</table>`;
  }

  const bg = variant === "primary" ? BRAND.gold : BRAND.navy;
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
  <tr>
    <td align="center" bgcolor="${bg}" style="background-color: ${bg}; border-radius: 8px; mso-padding-alt: 14px 28px;">
      <a href="${escapeAttr(url)}" target="_blank" style="display: inline-block; padding: 14px 28px; font-family: ${FONT_STACK}; font-size: 15px; font-weight: 600; line-height: 20px; color: ${BRAND.white}; text-decoration: none; border-radius: 8px; letter-spacing: 0.3px;">
        ${escapeHtml(text)}
      </a>
    </td>
  </tr>
</table>`;
}

/**
 * Deux CTAs côte à côte (primary + outline). Compatible mobile : passe en
 * stack vertical via la media query @600px du base layout (les boutons
 * tomberont automatiquement les uns sous les autres).
 */
export function ctaButtonPair(
  primary: { text: string; url: string },
  secondary: { text: string; url: string },
): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
  <tr>
    <td>${ctaButton({ text: primary.text, url: primary.url, variant: "primary" })}</td>
    <td width="12">&nbsp;</td>
    <td>${ctaButton({ text: secondary.text, url: secondary.url, variant: "outline" })}</td>
  </tr>
</table>`;
}

/**
 * Paragraphe corps standard (texte gris bleuté, line-height confortable).
 */
export function paragraph(html: string, options: { compact?: boolean } = {}): string {
  const margin = options.compact ? "0 0 8px 0" : "0 0 16px 0";
  return `<p class="nx-text-body" style="margin: ${margin}; font-family: ${FONT_STACK}; font-size: 15px; line-height: 24px; color: ${BRAND.textBody};">${html}</p>`;
}

/**
 * Encadré or pâle (info importante, montant mis en évidence).
 */
export function highlightBox(innerHtml: string): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="nx-pale-bg nx-pale-border" style="background-color: ${BRAND.goldPale}; border: 1px solid ${BRAND.goldBorder}; border-radius: 8px; margin: 0 0 24px 0;">
  <tr>
    <td style="padding: 20px 24px;">
      ${innerHtml}
    </td>
  </tr>
</table>`;
}

/**
 * Encadré informatif aux couleurs de marque (or pâle + bordure gauche or).
 * Pendant "info" du warningBox ambre. Utilisé pour les confirmations
 * d'action (accès maintenu jusqu'à X, opération réussie, etc.).
 */
export function infoBox(title: string, innerHtml: string): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="nx-pale-bg" style="background-color: ${BRAND.goldPale}; border-left: 4px solid ${BRAND.gold}; border-radius: 8px; margin: 0 0 24px 0;">
  <tr>
    <td style="padding: 20px 24px;">
      <p style="margin: 0 0 8px 0; color: ${BRAND.navy}; font-family: ${FONT_STACK}; font-size: 14px; font-weight: 600;">
        ${title}
      </p>
      <p style="margin: 0; color: ${BRAND.textBody}; font-family: ${FONT_STACK}; font-size: 13px; line-height: 22px;" class="nx-text-body">
        ${innerHtml}
      </p>
    </td>
  </tr>
</table>`;
}

/**
 * Liste de définitions label/valeur sur fond gris doux. Chaque entrée
 * affiche un libellé en petit gris au-dessus d'une valeur en navy gras,
 * séparée de la suivante par un trait fin. Utilisée pour les récapitulatifs
 * de paramètres (formule annulée, date, fin d'accès…).
 */
export function definitionList(items: Array<{ label: string; value: string }>): string {
  const rows = items
    .map((it, i) => {
      const isFirst = i === 0;
      const isLast = i === items.length - 1;
      const padding = isFirst
        ? "padding-bottom: 12px;"
        : isLast
          ? "padding-top: 12px;"
          : "padding: 12px 0;";
      const border = isLast ? "" : `border-bottom: 1px solid ${BRAND.border};`;
      return `
        <tr>
          <td style="${padding} ${border}">
            <p style="margin: 0; color: ${BRAND.textBody}; font-family: ${FONT_STACK}; font-size: 12px;" class="nx-text-body">
              ${escapeHtml(it.label)}
            </p>
            <p style="margin: 4px 0 0 0; color: ${BRAND.navy}; font-family: ${FONT_STACK}; font-size: 14px; font-weight: 600;">
              ${escapeHtml(it.value)}
            </p>
          </td>
        </tr>`;
    })
    .join("");

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="nx-soft-bg" style="background-color: ${BRAND.bgSoft}; border-radius: 8px; margin: 0 0 24px 0;">
  <tr>
    <td style="padding: 20px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${rows}
      </table>
    </td>
  </tr>
</table>`;
}

/**
 * Encadré ambre d'avertissement (alerte sécurité, action requise modérée).
 * Même esthétique qu'une mention "warning" Tailwind : fond ambre clair,
 * bordure gauche or foncé, titre + corps explicatif.
 */
export function warningBox(title: string, innerHtml: string): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FEF3C7; border-left: 4px solid #D97706; border-radius: 8px; margin: 0 0 24px 0;">
  <tr>
    <td style="padding: 16px 20px;">
      <p style="margin: 0 0 8px 0; color: #92400E; font-family: ${FONT_STACK}; font-size: 13px; font-weight: 600;">
        ${title}
      </p>
      <p style="margin: 0; color: #78350F; font-family: ${FONT_STACK}; font-size: 13px; line-height: 22px;">
        ${innerHtml}
      </p>
    </td>
  </tr>
</table>`;
}

/**
 * Liste d'étapes numérotées — chaque étape a un carré or arrondi avec
 * son numéro, un titre et une description courte. Utilisé pour les
 * onboarding (welcome) et les guides "comment commencer".
 */
export function numberedSteps(steps: Array<{ title: string; description: string }>): string {
  const rows = steps
    .map((step, i) => {
      const isLast = i === steps.length - 1;
      const borderBottom = isLast ? "" : `border-bottom: 1px solid ${BRAND.goldBorder};`;
      return `
  <tr>
    <td style="padding: 20px 24px; ${borderBottom}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="40" valign="top" style="padding-right: 16px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="40" height="40" style="width: 40px; height: 40px; background-color: ${BRAND.gold}; border-radius: 8px;">
              <tr>
                <td align="center" valign="middle" style="color: ${BRAND.white}; font-family: ${FONT_STACK}; font-size: 18px; font-weight: 700; mso-line-height-rule: exactly; line-height: 40px;">
                  ${i + 1}
                </td>
              </tr>
            </table>
          </td>
          <td valign="top">
            <p style="margin: 0; color: ${BRAND.navy}; font-family: ${FONT_STACK}; font-size: 15px; font-weight: 600; line-height: 22px;">
              ${escapeHtml(step.title)}
            </p>
            <p style="margin: 4px 0 0 0; color: ${BRAND.textBody}; font-family: ${FONT_STACK}; font-size: 13px; line-height: 22px;" class="nx-text-body">
              ${escapeHtml(step.description)}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
    })
    .join("");

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="nx-pale-bg" style="background-color: ${BRAND.goldPale}; border-radius: 8px; margin: 0 0 24px 0;">
  ${rows}
</table>`;
}

/**
 * Encadré "lien de secours" — affiche l'URL en monospace word-break dans
 * un fond gris clair, précédé d'une instruction. Utile pour les liens de
 * confirmation / réinitialisation dont le bouton CTA peut ne pas marcher
 * dans certains clients email.
 */
export function fallbackLink(url: string, instruction?: string): string {
  const intro =
    instruction ?? "Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :";
  return `
<p style="margin: 0; color: ${BRAND.textMuted}; font-family: ${FONT_STACK}; font-size: 12px; line-height: 18px;">
  ${escapeHtml(intro)}
</p>
<p style="margin: 8px 0 0 0; padding: 12px; background-color: ${BRAND.bgSoft}; border-radius: 6px; color: ${BRAND.navy}; font-family: 'Courier New', Consolas, monospace; font-size: 12px; line-height: 18px; word-break: break-all;" class="nx-soft-bg">
  ${escapeHtml(url)}
</p>`;
}

/**
 * Encadré "détails techniques" — clé/valeur avec icône optionnelle.
 * Utilisé pour les détails de connexion (date, IP, user-agent), montant
 * de transaction, méta-données diverses.
 */
export function detailsBox(
  title: string,
  items: Array<{ icon?: string; label: string }>,
): string {
  const rows = items
    .map(
      (it) => `
        <tr>
          <td style="padding: 2px 0; color: ${BRAND.textBody}; font-family: ${FONT_STACK}; font-size: 13px; line-height: 22px;" class="nx-text-body">
            ${it.icon ? `<span style="margin-right: 6px;">${it.icon}</span>` : ""}${escapeHtml(it.label)}
          </td>
        </tr>`,
    )
    .join("");

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="nx-soft-bg" style="background-color: ${BRAND.bgSoft}; border-radius: 8px; margin: 0 0 24px 0;">
  <tr>
    <td style="padding: 16px 20px;">
      <p style="margin: 0 0 8px 0; color: ${BRAND.navy}; font-family: ${FONT_STACK}; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">
        ${escapeHtml(title)}
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${rows}
      </table>
    </td>
  </tr>
</table>`;
}

/**
 * Encadré gris doux (aide, note secondaire).
 */
export function softBox(innerHtml: string): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="nx-soft-bg" style="background-color: ${BRAND.bgSoft}; border-radius: 8px; margin: 0 0 24px 0;">
  <tr>
    <td style="padding: 20px 24px;">
      ${innerHtml}
    </td>
  </tr>
</table>`;
}

// =============================================================================
// Helpers édito (newsletter, blog, contenu marketing)
// =============================================================================

/**
 * Petit titre or en small caps avec letter-spacing — élément récurrent
 * au-dessus des H1/H2 ou des cartes featured. Optionnellement en navy
 * sur fond clair (variant 'navy') ou or sur fond sombre (variant 'gold').
 */
export function eyebrow(text: string, variant: "gold" | "navy" = "gold"): string {
  const color = variant === "gold" ? BRAND.gold : BRAND.navy;
  return `<p style="margin: 0 0 8px 0; color: ${color}; font-family: ${FONT_STACK}; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;">${escapeHtml(text)}</p>`;
}

/**
 * Titre de section H2-style avec un underline 2px or sous le texte.
 * Utilisé pour découper la newsletter (Actualités, Stats, Astuce…).
 */
export function sectionTitle(text: string, emoji?: string): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 16px 0;">
  <tr>
    <td style="border-bottom: 2px solid ${BRAND.gold}; padding-bottom: 8px;">
      <p style="margin: 0; color: ${BRAND.navy}; font-family: ${FONT_STACK}; font-size: 18px; font-weight: 700; letter-spacing: -0.3px;">
        ${emoji ? `<span style="margin-right: 6px;">${emoji}</span>` : ""}${escapeHtml(text)}
      </p>
    </td>
  </tr>
</table>`;
}

/**
 * Carte "à la une" — encadré dégradé or pâle pour mettre en avant un
 * article, une nouveauté produit, une promo. eyebrow + H2 + excerpt + lien.
 */
export function featuredCard(args: {
  eyebrow: string;
  title: string;
  excerpt: string;
  linkUrl: string;
  linkText?: string;
}): string {
  const linkText = args.linkText ?? "Lire l'article complet →";
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="nx-pale-bg nx-pale-border" style="background: linear-gradient(135deg, ${BRAND.goldPale} 0%, #FFF5D6 100%); background-color: ${BRAND.goldPale}; border: 1px solid ${BRAND.goldBorder}; border-radius: 12px; margin: 0 0 16px 0;">
  <tr>
    <td style="padding: 28px;">
      ${eyebrow(args.eyebrow, "gold")}
      <h2 style="margin: 0 0 12px 0; color: ${BRAND.navy}; font-family: ${FONT_STACK}; font-size: 22px; font-weight: 700; line-height: 28px; letter-spacing: -0.3px;">
        ${escapeHtml(args.title)}
      </h2>
      <p style="margin: 0 0 20px 0; color: ${BRAND.textBody}; font-family: ${FONT_STACK}; font-size: 14px; line-height: 24px;" class="nx-text-body">
        ${escapeHtml(args.excerpt)}
      </p>
      <a href="${escapeAttr(args.linkUrl)}" style="color: ${BRAND.gold}; font-family: ${FONT_STACK}; font-size: 14px; font-weight: 600; text-decoration: none;">
        ${escapeHtml(linkText)}
      </a>
    </td>
  </tr>
</table>`;
}

/**
 * Item d'une liste de news (eyebrow catégorie + titre lien + excerpt).
 * Plusieurs items consécutifs : passer isLast pour omettre la bordure.
 */
export function newsItem(args: {
  category: string;
  title: string;
  url: string;
  excerpt: string;
  isLast?: boolean;
}): string {
  const border = args.isLast ? "" : `border-bottom: 1px solid ${BRAND.goldBorder};`;
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding: 16px 0; ${border}">
      <p style="margin: 0 0 4px 0; color: ${BRAND.textMuted}; font-family: ${FONT_STACK}; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">
        ${escapeHtml(args.category)}
      </p>
      <p style="margin: 0 0 6px 0; color: ${BRAND.navy}; font-family: ${FONT_STACK}; font-size: 15px; font-weight: 600; line-height: 21px;">
        <a href="${escapeAttr(args.url)}" style="color: ${BRAND.navy}; text-decoration: none;">${escapeHtml(args.title)}</a>
      </p>
      <p style="margin: 0; color: ${BRAND.textBody}; font-family: ${FONT_STACK}; font-size: 13px; line-height: 22px;" class="nx-text-body">
        ${escapeHtml(args.excerpt)}
      </p>
    </td>
  </tr>
</table>`;
}

/**
 * Rangée de 3 stats (cartes or pâle côte à côte). Valeur 28px or, label
 * small caps. Sur mobile, les 3 cellules tombent en stack vertical via
 * la media query du base layout (table avec td block).
 */
export function statsRow(stats: Array<{ value: string; label: string }>): string {
  if (stats.length !== 3) {
    throw new Error("statsRow attend exactement 3 entrées");
  }
  const cell = (s: { value: string; label: string }) => `
    <td width="33%" align="center" valign="top" class="nx-pale-bg" style="padding: 16px 8px; background-color: ${BRAND.goldPale}; border-radius: 8px;">
      <p style="margin: 0; color: ${BRAND.gold}; font-family: ${FONT_STACK}; font-size: 28px; font-weight: 700; line-height: 32px;">
        ${escapeHtml(s.value)}
      </p>
      <p style="margin: 6px 0 0 0; color: ${BRAND.textMuted}; font-family: ${FONT_STACK}; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">
        ${escapeHtml(s.label)}
      </p>
    </td>`;

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0;">
  <tr>
    ${cell(stats[0])}
    <td width="8">&nbsp;</td>
    ${cell(stats[1])}
    <td width="8">&nbsp;</td>
    ${cell(stats[2])}
  </tr>
</table>`;
}

/**
 * Carte "astuce" — encadré navy plein avec eyebrow or, titre blanc et
 * contenu gris bleuté. Inverse visuel du highlightBox (or sur fond clair
 * → or sur fond sombre).
 */
export function tipCard(args: { eyebrow: string; title: string; content: string }): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${BRAND.navy}; border-radius: 8px; margin: 0 0 24px 0;">
  <tr>
    <td style="padding: 24px 28px;">
      <p style="margin: 0 0 8px 0; color: ${BRAND.gold}; font-family: ${FONT_STACK}; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;">
        ${escapeHtml(args.eyebrow)}
      </p>
      <p style="margin: 0 0 12px 0; color: ${BRAND.white}; font-family: ${FONT_STACK}; font-size: 16px; font-weight: 600; line-height: 22px;">
        ${escapeHtml(args.title)}
      </p>
      <p style="margin: 0; color: ${BRAND.navySubtle}; font-family: ${FONT_STACK}; font-size: 13px; line-height: 22px;">
        ${escapeHtml(args.content)}
      </p>
    </td>
  </tr>
</table>`;
}

// =============================================================================
// Helpers marketing / promo (offres commerciales, codes de réduction)
// =============================================================================

/**
 * Gros badge or dégradé "Économisez X%" — pièce centrale d'un email promo.
 * box-shadow simulé via une bordure gold-dark (Outlook ignore les ombres
 * réelles ; on garde un rendu ferme par le contraste seul).
 */
export function discountBadge(args: { label: string; value: string; target: string }): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto; background: linear-gradient(135deg, ${BRAND.gold} 0%, ${BRAND.goldDark} 100%); background-color: ${BRAND.gold}; border-radius: 16px;">
  <tr>
    <td align="center" style="padding: 32px 48px;">
      <p style="margin: 0 0 4px 0; color: ${BRAND.white}; font-family: ${FONT_STACK}; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; opacity: 0.9;">
        ${escapeHtml(args.label)}
      </p>
      <p style="margin: 0; color: ${BRAND.white}; font-family: ${FONT_STACK}; font-size: 64px; font-weight: 800; line-height: 64px; letter-spacing: -2px;">
        ${escapeHtml(args.value)}
      </p>
      <p style="margin: 8px 0 0 0; color: ${BRAND.white}; font-family: ${FONT_STACK}; font-size: 14px; font-weight: 500; opacity: 0.95;">
        ${escapeHtml(args.target)}
      </p>
    </td>
  </tr>
</table>`;
}

/**
 * Code promo / code de réduction dans un encadré or pâle dashed bordé or.
 * Police monospace letter-spacing élevé pour mise en valeur. Optionnellement
 * une note de validité dessous.
 */
export function promoCode(args: { intro?: string; code: string; expiryNote?: string }): string {
  const intro = args.intro ?? "Utilisez le code promo";
  const expiry = args.expiryNote
    ? `<p style="margin: 12px 0 0 0; color: ${BRAND.textMuted}; font-family: ${FONT_STACK}; font-size: 12px;">${args.expiryNote}</p>`
    : "";

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center">
      <p style="margin: 0 0 8px 0; color: ${BRAND.textMuted}; font-family: ${FONT_STACK}; font-size: 13px;">
        ${escapeHtml(intro)}
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="nx-pale-bg" style="background-color: ${BRAND.goldPale}; border: 2px dashed ${BRAND.gold}; border-radius: 10px;">
        <tr>
          <td style="padding: 12px 24px;">
            <p style="margin: 0; color: ${BRAND.navy}; font-family: 'Courier New', Consolas, monospace; font-size: 24px; font-weight: 700; letter-spacing: 4px;">
              ${escapeHtml(args.code)}
            </p>
          </td>
        </tr>
      </table>
      ${expiry}
    </td>
  </tr>
</table>`;
}

/**
 * Liste de bénéfices avec check ✓ or — fond or pâle, titre optionnel.
 * Utilisée sur les emails promo et les pages onboarding pour énumérer
 * ce que l'abonnement inclut.
 */
export function benefitsList(args: { title?: string; items: string[] }): string {
  const titleHtml = args.title
    ? `<p style="margin: 0 0 16px 0; color: ${BRAND.navy}; font-family: ${FONT_STACK}; font-size: 14px; font-weight: 600; text-align: center;">${escapeHtml(args.title)}</p>`
    : "";
  const rows = args.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 6px 0;">
            <span style="color: ${BRAND.gold}; font-family: ${FONT_STACK}; font-size: 14px; font-weight: 700;">✓</span>
            <span style="color: ${BRAND.navy}; font-family: ${FONT_STACK}; font-size: 14px; line-height: 22px; margin-left: 8px;">${escapeHtml(item)}</span>
          </td>
        </tr>`,
    )
    .join("");

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="nx-pale-bg" style="background-color: ${BRAND.goldPale}; border-radius: 8px; margin: 0 0 24px 0;">
  <tr>
    <td style="padding: 24px 28px;">
      ${titleHtml}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${rows}
      </table>
    </td>
  </tr>
</table>`;
}

// =============================================================================
// Échappement (exposés pour les templates concrets)
// =============================================================================

export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeAttr(str: string): string {
  return escapeHtml(str);
}

export const FONT = FONT_STACK;
