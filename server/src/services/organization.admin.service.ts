import prisma from '../utils/prisma';
import { createLogger } from '../utils/logger';

const logger = createLogger('OrgAdminService');

export async function softDeleteOrganization(orgId: string, deletedBy: string) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new Error('Organisation introuvable');
  if (org.deletedAt) throw new Error('Organisation déjà supprimée');

  await prisma.organization.update({
    where: { id: orgId },
    data: { deletedAt: new Date(), deletedBy },
  });

  logger.info(`Organisation ${orgId} soft-deleted par ${deletedBy}`);
}

export async function restoreOrganization(orgId: string) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new Error('Organisation introuvable');
  if (!org.deletedAt) throw new Error('Organisation non supprimée');

  await prisma.organization.update({
    where: { id: orgId },
    data: { deletedAt: null, deletedBy: null },
  });

  logger.info(`Organisation ${orgId} restaurée`);
}

export async function hardDeleteOrganization(orgId: string) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new Error('Organisation introuvable');
  if (!org.deletedAt) throw new Error('L\'organisation doit être soft-deleted avant la suppression définitive');

  await prisma.organization.delete({ where: { id: orgId } });

  logger.info(`Organisation ${orgId} supprimée définitivement`);
}

export async function getOrganizationStats(orgId: string) {
  const [memberCount, conversationCount, messagesCount, sub] = await Promise.all([
    prisma.organizationMember.count({ where: { organizationId: orgId } }),
    prisma.conversation.count({ where: { organizationId: orgId } }),
    prisma.message.count({
      where: { conversation: { organizationId: orgId } },
    }),
    prisma.subscription.findUnique({ where: { organizationId: orgId } }),
  ]);

  return {
    members: memberCount,
    conversations: conversationCount,
    messages: messagesCount,
    plan: sub?.plan || 'FREE',
    creditsUsed: sub?.creditsUsed || 0,
    creditsPerMonth: sub?.creditsPerMonth || 0,
  };
}
