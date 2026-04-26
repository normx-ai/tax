import prisma from "../utils/prisma";
import { createLogger } from "../utils/logger";
import type { Prisma } from "@prisma/client";
import type { CreateEntiteInput, UpdateEntiteInput, ListEntitesQuery } from "../schemas/entites.schema";

const logger = createLogger("EntitesService");

export async function listEntites(orgId: string, query: ListEntitesQuery) {
  const where: Prisma.EntiteWhereInput = { organizationId: orgId };
  if (query.secteurActivite) where.secteurActivite = query.secteurActivite;
  if (typeof query.actif === "boolean") where.actif = query.actif;
  if (query.search) {
    where.OR = [
      { raisonSociale: { contains: query.search, mode: "insensitive" } },
      { sigle: { contains: query.search, mode: "insensitive" } },
      { niu: { contains: query.search, mode: "insensitive" } },
    ];
  }
  const [items, total] = await prisma.$transaction([
    prisma.entite.findMany({
      where,
      orderBy: [{ isClientSelf: "desc" }, { raisonSociale: "asc" }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.entite.count({ where }),
  ]);
  return { items, total, page: query.page, limit: query.limit };
}

export async function getEntiteById(orgId: string, id: string) {
  return prisma.entite.findFirst({
    where: { id, organizationId: orgId },
  });
}

export async function getClientSelf(orgId: string) {
  return prisma.entite.findFirst({
    where: { organizationId: orgId, isClientSelf: true },
  });
}

export async function createEntite(orgId: string, input: CreateEntiteInput) {
  // En mode entreprise (1 seule entite self), on empeche d'en creer plusieurs
  if (input.isClientSelf) {
    const existingSelf = await getClientSelf(orgId);
    if (existingSelf) {
      throw new Error("Une entité 'self' existe déjà pour cette organisation");
    }
  }

  const data: Prisma.EntiteCreateInput = {
    raisonSociale: input.raisonSociale,
    sigle: input.sigle,
    niu: input.niu,
    rccm: input.rccm,
    adresse: input.adresse,
    ville: input.ville,
    telephone: input.telephone,
    email: input.email || null,
    formeJuridique: input.formeJuridique,
    secteurActivite: input.secteurActivite,
    regimeIs: input.regimeIs,
    regimeTva: input.regimeTva,
    estEmployeur: input.estEmployeur,
    effectifSalaries: input.effectifSalaries,
    possedeFoncierBati: input.possedeFoncierBati,
    possedeFoncierNonBati: input.possedeFoncierNonBati,
    caEstimeAnneeCourante: input.caEstimeAnneeCourante,
    caRealiseAnneeN1: input.caRealiseAnneeN1,
    dateCreation: input.dateCreation ? new Date(input.dateCreation) : undefined,
    dateClotureExercice: input.dateClotureExercice,
    isClientSelf: input.isClientSelf,
    actif: input.actif,
    organization: { connect: { id: orgId } },
  };

  const created = await prisma.entite.create({ data });
  logger.info(`Entite creee : ${created.raisonSociale} (${created.id}) - org ${orgId}`);
  return created;
}

export async function updateEntite(orgId: string, id: string, input: UpdateEntiteInput) {
  // Verifie que l'entite appartient a l'organisation
  const existing = await getEntiteById(orgId, id);
  if (!existing) throw new Error("Entité non trouvée");

  const data: Prisma.EntiteUpdateInput = { ...input };
  if (input.dateCreation) data.dateCreation = new Date(input.dateCreation);

  return prisma.entite.update({ where: { id }, data });
}

export async function deactivateEntite(orgId: string, id: string) {
  const existing = await getEntiteById(orgId, id);
  if (!existing) throw new Error("Entité non trouvée");
  return prisma.entite.update({ where: { id }, data: { actif: false } });
}

export async function activateEntite(orgId: string, id: string) {
  const existing = await getEntiteById(orgId, id);
  if (!existing) throw new Error("Entité non trouvée");
  return prisma.entite.update({ where: { id }, data: { actif: true } });
}
