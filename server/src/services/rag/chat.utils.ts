// server/src/services/rag/chat.utils.ts
// Fonctions utilitaires pour le service de chat
// Copie de cgi-engine adaptée (sans .js)

import { SearchResult } from './hybrid-search.service';

export interface Citation {
  articleNumber: string;
  titre?: string;
  excerpt: string;
  score: number;
}

const GREETING_PATTERNS = [
  /^(bonjour|bonsoir|salut|hello|hi|hey|coucou|yo)\b/i,
  /^(merci|thanks|thank you)\b/i,
  /^(au revoir|bye|a bientot|a\+)\b/i,
  /^(comment vas-tu|ca va|comment tu vas)\b/i,
  /^(qui es-tu|tu es qui|c est quoi cgi)\b/i,
];

/**
 * Detecte si la requete necessite une recherche dans le CGI
 */
export function isFiscalQuery(query: string): boolean {
  const trimmed = query.trim();
  return !GREETING_PATTERNS.some((p) => p.test(trimmed));
}

/**
 * Convertit les codes tome internes en noms lisibles
 */
function formatTome(tome?: string): string {
  if (!tome) return '';
  const TOME_NAMES: Record<string, string> = {
    '1': 'Tome 1 - Impots directs',
    'P1': 'Tome 1 - Impots directs',
    '2': 'Tome 2 - Enregistrement, timbre, taxes indirectes',
    'P2': 'Tome 2 - Enregistrement, timbre, taxes indirectes',
    'TFNC2-CHARTE': 'Textes non codifies - Charte des investissements',
    'TFNC2-AGREMENT': 'Textes non codifies - Regime d\'agrement aux investissements',
    'TFNC2-ZES': 'Textes non codifies - Zones economiques speciales',
    'TFNC2-BVMAC': 'Textes non codifies - Operations sur la BVMAC',
    'TFNC2-INFRA': 'Textes non codifies - Infrastructures marchandes de l\'Etat',
    'TFNC3': 'Textes non codifies - Fiscalite petroliere',
    'TFNC3-MINES': 'Textes non codifies - Fiscalite miniere',
    'TFNC3-REDEV': 'Textes non codifies - Redevances minieres',
    'TFNC3-TVA': 'Textes non codifies - TVA secteur petrolier',
    'TFNC4-IGF': 'Textes non codifies - Impot global forfaitaire',
    'TFNC4-ASDI': 'Textes non codifies - Aide au developpement industriel (ASDI)',
    'TFNC4-CAMU': 'Textes non codifies - Couverture assurance maladie universelle (CAMU)',
    'TFNC4-TRANSF': 'Textes non codifies - Taxe sur les transferts de fonds',
    'TFNC4-JEU': 'Textes non codifies - Taxe sur les jeux de hasard',
    'TFNC4-PYLONE': 'Textes non codifies - Impot sur les pylones telecom',
    'TFNC4-AVION': 'Textes non codifies - Taxe sur les billets d\'avion internationaux',
    'TFNC4-ACCISES': 'Textes non codifies - Droits d\'accises (taxes specifiques)',
    'TFNC4-ACCIS2': 'Textes non codifies - Droits d\'accises (regime general)',
    'TFNC4-TUS': 'Textes non codifies - Taxe unique sur les salaires',
    'TFNC4-FONCIER': 'Textes non codifies - Droits fonciers exceptionnels',
    'TFNC4-TRESOR': 'Textes non codifies - Retenue a la source Tresor',
    'TFNC4-TV': 'Textes non codifies - Taxe sur les chaines televisuelles',
    'TFNC4-AUDIO': 'Textes non codifies - Redevance audiovisuelle',
    'TFNC4-EMBALL': 'Textes non codifies - Taxe sur les emballages',
    'TFNC5-NIU1': 'Textes non codifies - Numero d\'identification unique (NIU)',
    'TFNC5-NIU2': 'Textes non codifies - Structure du NIU',
    'TFNC5-NIU3': 'Textes non codifies - Formalites NIU',
    'TFNC5-ECHANG': 'Textes non codifies - Echange de renseignements fiscaux',
    'TFNC5-ATTEST': 'Textes non codifies - Attestation de non-redevance fiscale',
    'TFNC5-RISQUE': 'Textes non codifies - Gestion des risques fiscaux',
    'TFNC6': 'Textes non codifies - TVA',
    'CONV-CEMAC': 'Convention fiscale CEMAC',
    'CONV-FR': 'Convention fiscale Congo-France',
    'CONV-IT': 'Convention fiscale Congo-Italie',
    'CONV-CN': 'Convention fiscale Congo-Chine',
    'CONV-MU': 'Convention fiscale Congo-Maurice',
    'CONV-RW': 'Convention fiscale Congo-Rwanda',
    'ANNEXE': 'Annexes du CGI',
  };
  return TOME_NAMES[tome] || tome;
}

/**
 * Convertit les numéros d'articles techniques en texte lisible
 */
function formatArticleNumber(numero: string, tome?: string): string {
  // A3bis-14 → Art. 14 de l'Annexe 3 bis
  if (numero.startsWith('A3bis-')) {
    return `Art. ${numero.replace('A3bis-', '')} de l'Annexe 3 bis`;
  }
  // A6-1a → Art. 1a de l'Annexe 6
  if (numero.startsWith('A6-')) {
    return `Art. ${numero.replace('A6-', '')} de l'Annexe 6`;
  }
  // T2L1C1-ST1 → Section du Tome 2
  if (numero.startsWith('T2')) {
    const match = numero.match(/T2L(\d+)C(\d+)-(?:ST|A)(\w+)/);
    if (match) {
      return `Tome 2, Livre ${match[1]}, Chapitre ${match[2]}, Section ${match[3]}`;
    }
    return numero;
  }
  // NC-1 → Note complementaire 1
  if (numero.startsWith('NC-')) {
    return `Note complementaire ${numero.replace('NC-', '')}`;
  }
  // CI-AGR-4-compl → Complement Art. 4 Regime agrement
  if (numero.startsWith('CI-AGR-')) {
    return `Complement Art. ${numero.replace('CI-AGR-', '').replace('-compl', '')} du Regime d'agrement`;
  }
  // FR-Protocole, IT-PROTOCOLE
  if (numero.includes('Protocole') || numero.includes('PROTOCOLE')) {
    return `Protocole additionnel`;
  }
  // Annexe X → inchangé
  if (numero.startsWith('Annexe') || numero.startsWith('Livre')) {
    return numero;
  }
  // Numéro standard → Art. X
  return `Art. ${numero}`;
}

/**
 * Construit le contexte à partir des résultats de recherche
 */
export function buildContext(results: SearchResult[]): string {
  return results
    .map(r => {
      const { numero, titre, contenu, tome, chapitre } = r.payload;
      let header = formatArticleNumber(numero, tome);
      if (titre) header += ` - ${titre}`;
      if (chapitre) header += `, Chapitre ${chapitre}`;
      const tomeName = formatTome(tome);
      if (tomeName) header += `, ${tomeName}`;

      return `[${header}]\n${contenu.substring(0, 2000)}`;
    })
    .join('\n\n---\n\n');
}

/**
 * Extrait les numéros d'articles mentionnés dans la réponse de Claude
 */
export function extractArticlesFromResponse(response: string, searchResults: SearchResult[]): Citation[] {
  const articleRegex = /(?:l')?article\s*(\d+\s*[A-Z]?(?:\s*(?:,|et)\s*\d+\s*[A-Z]?)*)|art\.\s*(\d+\s*[A-Z]?)/gi;

  const mentionedArticles = new Set<string>();
  let match;

  while ((match = articleRegex.exec(response)) !== null) {
    const articleNumbers = (match[1] || match[2]).match(/\d+\s*[A-Z]?/gi);
    if (articleNumbers) {
      articleNumbers.forEach(num => {
        const normalized = num.replace(/\s+/g, ' ').trim().toUpperCase();
        mentionedArticles.add(normalized);
      });
    }
  }

  if (mentionedArticles.size === 0) {
    return [];
  }

  const citations: Citation[] = [];

  mentionedArticles.forEach(articleNum => {
    const found = searchResults.find(r =>
      r.payload.numero.includes(articleNum) ||
      r.payload.numero === `Art. ${articleNum}` ||
      r.payload.numero === `Article ${articleNum}`
    );

    if (found) {
      citations.push({
        articleNumber: `Art. ${articleNum}`,
        titre: found.payload.titre,
        excerpt: found.payload.contenu.substring(0, 200) + '...',
        score: found.score,
      });
    } else {
      citations.push({
        articleNumber: `Art. ${articleNum}`,
        excerpt: '',
        score: 0,
      });
    }
  });

  return citations.sort((a, b) => {
    const numA = parseInt(a.articleNumber.replace(/\D/g, ''));
    const numB = parseInt(b.articleNumber.replace(/\D/g, ''));
    return numA - numB;
  });
}
