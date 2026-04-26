import prisma from '../utils/prisma';
import { createLogger } from '../utils/logger';
import type { Prisma } from '@prisma/client';
import type {
  CreateObligationInput,
  UpdateObligationInput,
  ListObligationsQuery,
} from '../schemas/obligations.schema';

const logger = createLogger('ObligationsService');

interface ListResult {
  items: Awaited<ReturnType<typeof prisma.obligation.findMany>>;
  total: number;
  page: number;
  limit: number;
}

export async function listObligations(query: ListObligationsQuery): Promise<ListResult> {
  const where: Prisma.ObligationWhereInput = {};
  if (query.version) where.version = query.version;
  if (query.categorie) where.categorie = query.categorie;
  if (query.periodicite) where.periodicite = query.periodicite;
  if (typeof query.actif === 'boolean') where.actif = query.actif;
  if (query.search) {
    where.OR = [
      { code: { contains: query.search, mode: 'insensitive' } },
      { libelle: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await prisma.$transaction([
    prisma.obligation.findMany({
      where,
      include: { article: { select: { id: true, numero: true, titre: true } } },
      orderBy: [{ ordre: 'asc' }, { code: 'asc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.obligation.count({ where }),
  ]);

  return { items, total, page: query.page, limit: query.limit };
}

export async function getObligationById(id: string) {
  return prisma.obligation.findUnique({
    where: { id },
    include: { article: { select: { id: true, numero: true, titre: true, contenu: true } } },
  });
}

export async function createObligation(input: CreateObligationInput) {
  // Si articleNumero fourni sans articleId, on essaie de resoudre via la KB
  let resolvedArticleId = input.articleId;
  if (!resolvedArticleId && input.articleNumero) {
    const article = await prisma.article.findFirst({
      where: { numero: input.articleNumero, version: input.version },
      select: { id: true },
    });
    if (article) resolvedArticleId = article.id;
  }

  const created = await prisma.obligation.create({
    data: {
      ...input,
      articleId: resolvedArticleId,
      echeanceRule: input.echeanceRule as Prisma.InputJsonValue,
      applicabilite: input.applicabilite as Prisma.InputJsonValue,
    },
  });
  logger.info(`Obligation creee : ${created.code} (${created.version})`);
  return created;
}

export async function updateObligation(id: string, input: UpdateObligationInput) {
  const { echeanceRule, applicabilite, ...rest } = input;
  const data: Prisma.ObligationUpdateInput = { ...rest };
  if (echeanceRule !== undefined) {
    data.echeanceRule = echeanceRule as Prisma.InputJsonValue;
  }
  if (applicabilite !== undefined) {
    data.applicabilite = applicabilite as Prisma.InputJsonValue;
  }
  // Re-resoudre l'article si numero change sans id explicite
  if (input.articleNumero && !input.articleId) {
    const article = await prisma.article.findFirst({
      where: {
        numero: input.articleNumero,
        version: input.version ?? (await prisma.obligation.findUnique({ where: { id }, select: { version: true } }))?.version ?? '2026',
      },
      select: { id: true },
    });
    if (article) data.article = { connect: { id: article.id } };
  }
  return prisma.obligation.update({ where: { id }, data });
}

export async function deactivateObligation(id: string) {
  return prisma.obligation.update({ where: { id }, data: { actif: false } });
}

export async function activateObligation(id: string) {
  return prisma.obligation.update({ where: { id }, data: { actif: true } });
}

export async function cloneVersion(fromVersion: string, toVersion: string) {
  const source = await prisma.obligation.findMany({ where: { version: fromVersion } });
  if (source.length === 0) {
    return { cloned: 0, message: `Aucune obligation pour la version ${fromVersion}` };
  }
  // Verifie qu'il n'y a pas deja des obligations dans toVersion (idempotence simple)
  const existing = await prisma.obligation.count({ where: { version: toVersion } });
  if (existing > 0) {
    return { cloned: 0, message: `La version ${toVersion} contient deja ${existing} obligations. Annulez avant de cloner.` };
  }
  const created = await prisma.$transaction(
    source.map(o => prisma.obligation.create({
      data: {
        code: o.code,
        libelle: o.libelle,
        description: o.description,
        categorie: o.categorie,
        periodicite: o.periodicite,
        echeanceRule: o.echeanceRule as Prisma.InputJsonValue,
        applicabilite: o.applicabilite as Prisma.InputJsonValue,
        articleNumero: o.articleNumero,
        // Note : on NE conserve PAS articleId, l'article peut avoir une autre
        // version. Le numero permet de re-resoudre apres ingestion du CGI N+1.
        simulateurCode: o.simulateurCode,
        version: toVersion,
        actif: o.actif,
        ordre: o.ordre,
      },
    })),
  );
  logger.info(`Clone obligations ${fromVersion} -> ${toVersion} : ${created.length} entrees`);
  return { cloned: created.length, message: 'OK' };
}

/** Liste simplifiee des AlerteFiscale, groupees par categorie, pour aider
 *  l'admin a remplir les obligations a partir des donnees deja extraites
 *  du CGI par le moteur de NLP. */
export async function getAlertesByCategorie() {
  const alertes = await prisma.alerteFiscale.findMany({
    where: { actif: true, type: { in: ['ECHEANCE', 'OBLIGATION'] } },
    select: {
      id: true,
      type: true,
      categorie: true,
      titre: true,
      description: true,
      valeur: true,
      unite: true,
      periodicite: true,
      articleNumero: true,
    },
    orderBy: [{ categorie: 'asc' }, { articleNumero: 'asc' }],
  });
  // Groupage par categorie pour affichage ergonomique cote UI
  const groups: Record<string, typeof alertes> = {};
  for (const a of alertes) {
    const k = String(a.categorie);
    if (!groups[k]) groups[k] = [];
    groups[k].push(a);
  }
  return groups;
}

/** Recherche d'articles CGI pour autocomplete (par numero ou titre). */
export async function searchArticles(query: string, version = '2026', limit = 10) {
  if (!query || query.length < 1) return [];
  return prisma.article.findMany({
    where: {
      version,
      OR: [
        { numero: { contains: query, mode: 'insensitive' } },
        { titre: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: { id: true, numero: true, titre: true, tome: true, livre: true },
    orderBy: { numero: 'asc' },
    take: limit,
  });
}

/** Liste des codes simulateurs disponibles cote mobile (pour le select du
 *  formulaire obligation). Statique car ces simulateurs sont dans le code
 *  React Native, pas dans une table BD. */
export const SIMULATEUR_CODES = [
  'patente',
  'is',
  'is-parapetrolier',
  'its',
  'tva',
  'ircm',
  'iba',
  'igf',
  'irf-loyers',
  'contribution-fonciere',
  'taxe-immobiliere',
  'cession-parts',
  'enregistrement',
  'solde-liquidation',
  'retenue-source',
  'paie',
] as const;
