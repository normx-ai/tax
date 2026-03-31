import prisma from '../utils/prisma';
import { createLogger } from '../utils/logger';
import { PlanName, PLAN_QUOTAS, isPlanAtLeast, isUnlimited, isPaidPlan } from '../types/plans';
import { cacheService, CACHE_PREFIX } from '../utils/cache';
import { EmailService } from './email.service';
import { PushService } from './push.service';

const logger = createLogger('SubscriptionService');

export async function getSubscription(orgId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { organizationId: orgId },
  });
  if (!sub) throw new Error('Abonnement introuvable');

  await checkExpiry(sub);
  return sub;
}

/**
 * Activation manuelle d'un abonnement après réception du paiement.
 * Définit le plan, active pour 1 an à partir d'aujourd'hui.
 */
export async function activateSubscription(orgId: string, plan: PlanName) {
  if (plan === 'FREE') {
    throw new Error('Impossible d\'activer un plan gratuit');
  }

  const sub = await prisma.subscription.findUnique({ where: { organizationId: orgId } });
  if (!sub) throw new Error('Abonnement introuvable');

  const quota = PLAN_QUOTAS[plan];
  const now = new Date();
  const oneYearLater = new Date(now);
  oneYearLater.setFullYear(now.getFullYear() + 1);

  const updated = await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      plan,
      status: 'ACTIVE',
      creditsPerMonth: quota.creditsPerMonth,
      creditsUsed: 0,
      currentPeriodStart: now,
      currentPeriodEnd: oneYearLater,
    },
  });

  // Reset les crédits individuels de tous les membres
  await prisma.organizationMember.updateMany({
    where: { organizationId: orgId },
    data: { creditsUsed: 0 },
  });

  cacheService.del(`${CACHE_PREFIX.SUBSCRIPTION}${orgId}`);
  logger.info(`Abonnement activé: ${plan} pour org ${orgId} — ${quota.creditsPerMonth} crédits/mois — valide jusqu'au ${oneYearLater.toISOString().split('T')[0]}`);
  return updated;
}

/**
 * Renouvellement : réactive pour 1 an supplémentaire.
 */
export async function renewSubscription(orgId: string) {
  const sub = await prisma.subscription.findUnique({ where: { organizationId: orgId } });
  if (!sub) throw new Error('Abonnement introuvable');

  const plan = sub.plan as PlanName;
  if (plan === 'FREE') {
    throw new Error('Impossible de renouveler un plan gratuit');
  }

  const now = new Date();
  const oneYearLater = new Date(now);
  oneYearLater.setFullYear(now.getFullYear() + 1);

  const updated = await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      status: 'ACTIVE',
      creditsUsed: 0,
      currentPeriodStart: now,
      currentPeriodEnd: oneYearLater,
    },
  });

  // Reset les crédits individuels
  await prisma.organizationMember.updateMany({
    where: { organizationId: orgId },
    data: { creditsUsed: 0 },
  });

  cacheService.del(`${CACHE_PREFIX.SUBSCRIPTION}${orgId}`);
  logger.info(`Abonnement renouvelé: ${plan} pour org ${orgId} — valide jusqu'au ${oneYearLater.toISOString().split('T')[0]}`);
  return updated;
}

export async function upgradePlan(orgId: string, newPlan: PlanName) {
  const sub = await prisma.subscription.findUnique({ where: { organizationId: orgId } });
  if (!sub) throw new Error('Abonnement introuvable');

  const currentPlan = sub.plan as PlanName;
  if (!isPlanAtLeast(newPlan, currentPlan)) {
    throw new Error(`Le plan ${newPlan} n'est pas supérieur au plan actuel ${currentPlan}`);
  }
  if (newPlan === currentPlan) {
    throw new Error('Vous êtes déjà sur ce plan');
  }

  const quota = PLAN_QUOTAS[newPlan];
  const updated = await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      plan: newPlan,
      creditsPerMonth: quota.creditsPerMonth,
    },
  });

  cacheService.del(`${CACHE_PREFIX.SUBSCRIPTION}${orgId}`);
  logger.info(`Plan upgradé: ${currentPlan} -> ${newPlan} pour org ${orgId}`);
  return updated;
}

/**
 * Vérifie le quota de crédits d'un utilisateur.
 */
export async function checkQuota(orgId: string, userId?: string) {
  const sub = await prisma.subscription.findUnique({ where: { organizationId: orgId } });
  if (!sub) throw new Error('Abonnement introuvable');

  await checkExpiry(sub);

  const creditsPerMonth = sub.creditsPerMonth;

  // Si userId fourni, retourner le quota individuel
  if (userId) {
    const member = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });
    const userUsed = member?.creditsUsed || 0;
    await lazyResetMemberIfNewMonth(orgId);

    return {
      plan: sub.plan,
      creditsUsed: userUsed,
      creditsPerMonth,
      creditsTotal: sub.creditsTotal,
      creditsPurchased: sub.creditsPurchased,
      remaining: isUnlimited(creditsPerMonth) ? -1 : creditsPerMonth - userUsed,
      isUnlimited: isUnlimited(creditsPerMonth),
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      status: sub.status,
    };
  }

  // Fallback : quota global org
  return {
    plan: sub.plan,
    creditsUsed: sub.creditsUsed,
    creditsPerMonth,
    creditsTotal: sub.creditsTotal,
    creditsPurchased: sub.creditsPurchased,
    remaining: isUnlimited(creditsPerMonth) ? -1 : creditsPerMonth - sub.creditsUsed,
    isUnlimited: isUnlimited(creditsPerMonth),
    currentPeriodStart: sub.currentPeriodStart,
    currentPeriodEnd: sub.currentPeriodEnd,
    status: sub.status,
  };
}

/**
 * Incrémente les crédits utilisés d'un utilisateur spécifique dans son organisation.
 */
export async function incrementQuota(orgId: string, userId: string) {
  await lazyResetMemberIfNewMonth(orgId);

  await prisma.organizationMember.updateMany({
    where: { userId, organizationId: orgId },
    data: { creditsUsed: { increment: 1 } },
  });

  // Aussi incrémenter sur Subscription pour le suivi global admin
  await prisma.subscription.update({
    where: { organizationId: orgId },
    data: { creditsUsed: { increment: 1 } },
  }).catch((err) => {
    logger.error('Echec increment compteur credits org', err);
  });

  cacheService.del(`${CACHE_PREFIX.SUBSCRIPTION}${orgId}`);
}

/**
 * Vérifie si l'abonnement (annuel ou essai) a expiré.
 */
async function checkExpiry(sub: { id: string; plan: string; status: string; currentPeriodEnd: Date | null; organizationId: string | null }) {
  if (sub.status === 'EXPIRED' || sub.status === 'CANCELLED') return;
  if (!sub.currentPeriodEnd) return;

  const now = new Date();
  if (now > new Date(sub.currentPeriodEnd)) {
    const label = sub.status === 'TRIALING' ? 'Essai expiré' : 'Abonnement expiré';
    logger.info(`${label} pour sub ${sub.id}`);
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: 'EXPIRED',
        plan: 'FREE',
        creditsPerMonth: 0,
        creditsUsed: 0,
      },
    });
    sub.status = 'EXPIRED';
    sub.plan = 'FREE';

    if (sub.organizationId) {
      cacheService.del(`${CACHE_PREFIX.SUBSCRIPTION}${sub.organizationId}`);
    }
  }
}

/**
 * Lazy reset mensuel : si nouveau mois, remet les creditsUsed de tous les membres à 0.
 */
async function lazyResetMemberIfNewMonth(orgId: string) {
  const sub = await prisma.subscription.findUnique({ where: { organizationId: orgId } });
  if (!sub) return;

  const now = new Date();
  const periodStart = new Date(sub.currentPeriodStart);
  if (now.getFullYear() !== periodStart.getFullYear() || now.getMonth() !== periodStart.getMonth()) {
    logger.info(`Lazy reset crédits pour org ${orgId} (tous les membres)`);

    await prisma.organizationMember.updateMany({
      where: { organizationId: orgId },
      data: { creditsUsed: 0 },
    });

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        creditsUsed: 0,
        currentPeriodStart: new Date(now.getFullYear(), now.getMonth(), 1),
      },
    });

    cacheService.del(`${CACHE_PREFIX.SUBSCRIPTION}${orgId}`);
  }
}

/**
 * Acheter un pack de crédits. Incrémente creditsPurchased sur la subscription.
 */
export async function purchaseCreditPack(orgId: string, credits: number) {
  const sub = await prisma.subscription.findUnique({ where: { organizationId: orgId } });
  if (!sub) throw new Error('Abonnement introuvable');

  const updated = await prisma.subscription.update({
    where: { id: sub.id },
    data: { creditsPurchased: { increment: credits } },
  });

  cacheService.del(`${CACHE_PREFIX.SUBSCRIPTION}${orgId}`);
  logger.info(`${credits} crédits achetés pour org ${orgId}`);
  return updated;
}
