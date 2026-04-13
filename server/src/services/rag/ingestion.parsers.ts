// server/src/services/rag/ingestion.parsers.ts
// Parseurs et transformations pour l'ingestion d'articles CGI
// Copie de cgi-engine

export interface ArticleSourceMeta {
  document?: string;
  pays?: string;
  edition?: string;
  version?: string;
  tome?: number | string;
  partie?: number;
  livre?: number;
  chapitre?: number;
  chapitre_titre?: string;
  titre?: string;
  section?: number;
  section_titre?: string;
  page_source?: number;
  source?: string;
}

export interface ArticleSource {
  article: string;
  titre?: string;
  chapeau?: string;
  texte: string[];
  mots_cles?: string[];
  statut?: string;
  section?: string;
}

export interface SousSection {
  sous_section?: number;
  titre?: string;
  articles?: ArticleSource[];
  paragraphes?: Array<{
    paragraphe?: number;
    titre?: string;
    articles?: ArticleSource[];
  }>;
}

export interface Section {
  section?: number;
  titre?: string;
  articles?: ArticleSource[];
  sous_sections?: SousSection[];
}

export interface SourceFile {
  meta: ArticleSourceMeta;
  articles?: ArticleSource[];
  sous_sections?: SousSection[];
  sections?: Section[];
}

export interface ArticleJSON {
  numero: string;
  titre?: string;
  chapeau?: string;
  contenu: string;
  tome?: string;
  partie?: string;
  livre?: string;
  chapitre?: string;
  section?: string;
  version?: string;
  keywords?: string[];
  statut?: string;
}

/**
 * Parser le numéro d'article (nettoyer préfixes et ordinaux)
 */
export function parseArticleNumber(article: string): string {
  let numero = article.replace(/^Art(?:icle)?\.?\s*/i, '').trim();
  numero = numero.replace(/^(\d+)(?:er|ère|ème)(\s|$)/i, '$1$2');
  if (!numero) {
    return article.trim();
  }
  return numero;
}

/**
 * Extraire tous les articles d'une source (gère plusieurs formats)
 */
export function extractArticlesFromSource(source: SourceFile): ArticleSource[] {
  const allArticles: ArticleSource[] = [];

  const addWithSection = (articles: ArticleSource[], sectionTitle?: string) => {
    for (const art of articles) {
      if (!art.section || typeof art.section !== 'string') {
        allArticles.push({ ...art, section: sectionTitle });
      } else {
        allArticles.push(art);
      }
    }
  };

  // Articles directs à la racine
  if (source.articles) {
    let currentSection: string | undefined;
    for (const art of source.articles) {
      if (art.article && /^T\d+L\d+C\d+-ST/.test(art.article)) {
        currentSection = art.titre;
        allArticles.push(art);
      } else {
        if (!art.section && currentSection) {
          allArticles.push({ ...art, section: currentSection });
        } else {
          allArticles.push(art);
        }
      }
    }
  }

  // Articles dans les sections (format unifié 2025/2026)
  if (source.sections) {
    for (const section of source.sections) {
      const sectionTitle = section.titre || (section.section ? `Section ${section.section}` : undefined);
      if (section.articles) {
        addWithSection(section.articles, sectionTitle);
      }
      if (section.sous_sections) {
        for (const sousSection of section.sous_sections) {
          const sousSectionTitle = sousSection.titre || sectionTitle;
          if (sousSection.articles) {
            addWithSection(sousSection.articles, sousSectionTitle);
          }
        }
      }
    }
  }

  // Articles dans les sous-sections (ancien format)
  if (source.sous_sections) {
    for (const sousSection of source.sous_sections) {
      const sectionTitle =
        sousSection.titre || (sousSection.sous_section ? `Sous-section ${sousSection.sous_section}` : undefined);
      if (sousSection.articles) {
        addWithSection(sousSection.articles, sectionTitle);
      }
      if (sousSection.paragraphes) {
        for (const paragraphe of sousSection.paragraphes) {
          const paraTitle = paragraphe.titre || sectionTitle;
          if (paragraphe.articles) {
            addWithSection(paragraphe.articles, paraTitle);
          }
        }
      }
    }
  }

  return allArticles;
}

/**
 * Transformer une source en articles JSON normalisés
 */
export function transformSourceToArticles(source: SourceFile): ArticleJSON[] {
  const { meta } = source;
  const articles = extractArticlesFromSource(source);

  const validArticles = articles.filter((art) => art.article && typeof art.article === 'string');

  return validArticles.map((art) => ({
    numero: parseArticleNumber(art.article),
    titre: art.titre,
    chapeau: art.chapeau,
    contenu: art.texte.join('\n'),
    tome: meta.tome?.toString(),
    partie: meta.partie ? `Partie ${meta.partie}` : undefined,
    livre: meta.livre ? `Livre ${meta.livre}` : undefined,
    chapitre: meta.chapitre_titre || (meta.chapitre ? `Chapitre ${meta.chapitre}` : undefined),
    section:
      typeof art.section === 'string'
        ? art.section
        : meta.section_titre ||
          (typeof meta.titre === 'string' ? meta.titre : undefined) ||
          (meta.section ? `Section ${meta.section}` : undefined),
    version: meta.version || meta.edition || '2026',
    keywords: art.mots_cles || [],
    statut: art.statut || 'en vigueur',
  }));
}

/**
 * Préparer le texte d'un article pour l'embedding
 */
export function prepareArticleText(article: ArticleJSON): string {
  const parts: string[] = [];
  if (article.numero) parts.push(`Article ${article.numero}`);
  if (article.titre) parts.push(article.titre);
  if (article.tome) parts.push(`Tome: ${article.tome}`);
  if (article.chapitre) parts.push(`Chapitre: ${article.chapitre}`);
  parts.push(article.contenu);
  if (article.keywords?.length) parts.push(`Mots-clés: ${article.keywords.join(', ')}`);
  return parts.join('\n');
}

/**
 * Filtre les articles "vides" qui n'ont pas a etre indexes :
 * - "Abroge", "Sans objet", "Reserve" : pas de contenu utile
 * - Contenu trop court pour porter du sens (< 30 chars hors espaces)
 *
 * Ces articles polluaient la recherche RAG et descendaient le taux de
 * couverture artificiellement.
 */
export function isMeaningfulArticle(article: ArticleJSON): boolean {
  const titre = (article.titre || '').toLowerCase().trim();
  const contenu = (article.contenu || '').replace(/\s+/g, ' ').trim();

  // Titres explicitement vides
  if (/^(abrog[eé]|sans objet|r[eé]serv[eé]|supprim[eé])$/i.test(titre)) return false;

  // Contenu trop court (< 30 chars)
  if (contenu.length < 30) return false;

  // Contenu qui dit explicitement "abroge" ou "sans objet"
  if (/^(article\s+)?(abrog[eé]|sans objet|r[eé]serv[eé]|supprim[eé])\.?$/i.test(contenu)) return false;

  return true;
}
