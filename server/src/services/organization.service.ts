import prisma from '../utils/prisma';
import { createLogger } from '../utils/logger';
import { PLAN_QUOTAS, PlanName } from '../types/plans';
import { EmailService } from './email.service';

const logger = createLogger('OrganizationService');

export async function getUserOrganizations(userId: string) {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    include: {
      organization: {
        include: {
          subscription: { select: { plan: true, status: true } },
          _count: { select: { members: true } },
        },
      },
    },
  });

  return memberships
    .filter(m => !m.organization.deletedAt)
    .map(m => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      logo: m.organization.logo,
      role: m.role,
      plan: m.organization.subscription?.plan || 'FREE',
      memberCount: m.organization._count.members,
      joinedAt: m.joinedAt,
    }));
}

export async function createOrganization(userId: string, userEmail: string, data: { name?: string; entrepriseNom?: string; website?: string; address?: string; phone?: string }) {
  // Accepter 'name' (schéma REST standard) ou 'entrepriseNom' (formulaire register legacy) — HIGH-06 / LOW-04
  // En interne, on utilise systématiquement 'name' (champ Prisma). 'entrepriseNom' est conservé
  // uniquement pour la rétrocompatibilité avec le formulaire d'inscription mobile.
  const orgName = data.name || data.entrepriseNom;
  if (!orgName) throw new Error('Nom de l\'organisation requis');

  // BP4 : valider le slug contre les mots réservés
  const RESERVED_SLUGS = ['admin', 'api', 'auth', 'system', 'root', 'null', 'undefined', 'test', 'www', 'app', 'help', 'support'];
  const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (RESERVED_SLUGS.includes(slug)) {
    throw new Error('Ce nom d\'organisation est réservé');
  }

  const org = await prisma.organization.create({
    data: {
      name: orgName,
      slug: `${slug}-${Date.now()}`,
      website: data.website,
      address: data.address,
      phone: data.phone,
    },
  });

  await prisma.organizationMember.create({
    data: { userId, organizationId: org.id, role: 'OWNER' },
  });

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + PLAN_QUOTAS.FREE.trialDays);
  await prisma.subscription.create({
    data: {
      type: 'ORGANIZATION',
      organizationId: org.id,
      plan: 'FREE',
      status: 'TRIALING',
      creditsPerMonth: PLAN_QUOTAS.FREE.creditsPerMonth,
      creditsTotal: PLAN_QUOTAS.FREE.creditsTotal,
      currentPeriodEnd: trialEnd,
      trialEndsAt: trialEnd,
    },
  });

  logger.info(`Organisation créée: ${org.name} par ${userEmail}`);
  return org;
}

export async function getOrganizationById(orgId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      subscription: true,
      _count: { select: { members: true, conversations: true } },
    },
  });

  if (!org || org.deletedAt) throw new Error('Organisation introuvable');
  return org;
}

export async function updateOrganization(orgId: string, data: { name?: string; logo?: string; website?: string; address?: string; phone?: string; settings?: Record<string, unknown> }) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org || org.deletedAt) throw new Error('Organisation introuvable');

  const before = { name: org.name, logo: org.logo, website: org.website, address: org.address, phone: org.phone };

  const updated = await prisma.organization.update({
    where: { id: orgId },
    data: {
      name: data.name,
      logo: data.logo,
      website: data.website,
      address: data.address,
      phone: data.phone,
      settings: data.settings ? JSON.stringify(data.settings) : undefined,
    },
  });

  return { before, after: updated };
}

export async function getMembers(orgId: string) {
  return prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, avatar: true, lastLoginAt: true } },
    },
    orderBy: { joinedAt: 'asc' },
  });
}

export async function inviteMember(orgId: string, invitedById: string, email: string, role: string = 'MEMBER') {
  // Vérifier quota sièges payés
  const sub = await prisma.subscription.findUnique({ where: { organizationId: orgId } });
  if (sub) {
    const memberCount = await prisma.organizationMember.count({ where: { organizationId: orgId } });
    const pendingCount = await prisma.invitation.count({
      where: { organizationId: orgId, status: 'PENDING' },
    });
    const totalOccupied = memberCount + pendingCount;

    // Pas de limite de membres dans le nouveau système de crédits
  }

  // Vérifier invitation existante
  const existing = await prisma.invitation.findUnique({
    where: { email_organizationId: { email, organizationId: orgId } },
  });
  if (existing && existing.status === 'PENDING') {
    throw new Error('Une invitation est déjà en attente pour cet email');
  }

  // Vérifier si déjà membre
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const member = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
    });
    if (member) throw new Error('Cet utilisateur est déjà membre');
  }

  const invitation = await prisma.invitation.upsert({
    where: { email_organizationId: { email, organizationId: orgId } },
    update: {
      role: role as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER',
      status: 'PENDING',
      invitedById,
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    create: {
      email,
      role: role as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER',
      organizationId: orgId,
      invitedById,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Envoyer l'email d'invitation
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  const inviter = await prisma.user.findUnique({ where: { id: invitedById } });
  const inviterName = inviter ? `${inviter.firstName || ''} ${inviter.lastName || ''}`.trim() || inviter.email : 'Un membre';
  const orgName = org?.name || 'une organisation';

  EmailService.sendInvitation(email, orgName, inviterName, invitation.token).catch((err) => {
    logger.error(`Erreur envoi email invitation à ${email}:`, err);
  });

  logger.info(`Invitation envoyée à ${email} pour org ${orgId}`);
  return invitation;
}

export async function removeMember(orgId: string, userId: string) {
  const member = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });
  if (!member) throw new Error('Membre introuvable');
  if (member.role === 'OWNER') throw new Error('Impossible de retirer le propriétaire');

  await prisma.organizationMember.delete({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });

  logger.info(`Membre ${userId} retiré de org ${orgId}`);
}

export async function changeMemberRole(orgId: string, userId: string, newRole: string) {
  const member = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });
  if (!member) throw new Error('Membre introuvable');
  if (member.role === 'OWNER') throw new Error('Impossible de changer le rôle du propriétaire');
  if (newRole === 'OWNER') throw new Error('Utilisez le transfert de propriété pour nommer un nouveau propriétaire');

  const updated = await prisma.organizationMember.update({
    where: { userId_organizationId: { userId, organizationId: orgId } },
    data: { role: newRole as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' },
  });

  return updated;
}

export async function transferOwnership(orgId: string, currentOwnerId: string, newOwnerId: string) {
  const currentOwner = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: currentOwnerId, organizationId: orgId } },
  });
  if (!currentOwner || currentOwner.role !== 'OWNER') throw new Error('Seul le propriétaire peut transférer la propriété');

  const newOwner = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: newOwnerId, organizationId: orgId } },
  });
  if (!newOwner) throw new Error('Le nouveau propriétaire doit être membre de l\'organisation');

  await prisma.$transaction([
    prisma.organizationMember.update({
      where: { userId_organizationId: { userId: currentOwnerId, organizationId: orgId } },
      data: { role: 'ADMIN' },
    }),
    prisma.organizationMember.update({
      where: { userId_organizationId: { userId: newOwnerId, organizationId: orgId } },
      data: { role: 'OWNER' },
    }),
  ]);

  logger.info(`Propriété transférée de ${currentOwnerId} à ${newOwnerId} pour org ${orgId}`);
}

export async function getInvitations(orgId: string) {
  return prisma.invitation.findMany({
    where: { organizationId: orgId },
    include: {
      invitedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function cancelInvitation(orgId: string, invitationId: string) {
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, organizationId: orgId },
  });
  if (!invitation) throw new Error('Invitation introuvable');

  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: 'CANCELLED' },
  });
}

export async function acceptInvitation(userId: string, token: string) {
  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation) throw new Error('Invitation introuvable');
  if (invitation.status !== 'PENDING') throw new Error('Cette invitation n\'est plus valide');
  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({ where: { id: invitation.id }, data: { status: 'EXPIRED' } });
    throw new Error('Cette invitation a expiré');
  }

  // Vérifier si déjà membre
  const existing = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: invitation.organizationId } },
  });
  if (existing) throw new Error('Vous êtes déjà membre de cette organisation');

  await prisma.$transaction([
    prisma.organizationMember.create({
      data: {
        userId,
        organizationId: invitation.organizationId,
        role: invitation.role,
      },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    }),
  ]);

  logger.info(`Invitation acceptée par user ${userId} pour org ${invitation.organizationId}`);
  return { organizationId: invitation.organizationId, role: invitation.role };
}
