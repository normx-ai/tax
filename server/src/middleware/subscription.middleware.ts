import { Response, NextFunction } from 'express';
import { AuthRequest } from './keycloak-auth';
import prisma from '../utils/prisma';
import { cacheService, CACHE_TTL, CACHE_PREFIX } from '../utils/cache';
import { PlanName, isPlanAtLeast, isUnlimited, isPaidPlan, CREDITS_PER_AUDIT } from '../types/plans';
import { createLogger } from '../utils/logger';

const logger = createLogger('SubscriptionMiddleware');

interface SubContext {
  plan: PlanName;
  status: string;
  creditsPerMonth: number; // credits mensuels par user
  currentPeriodStart: Date;
  currentPeriodEnd: Date | null;
}

async function getSubContext(orgId: string): Promise<SubContext | null> {
  const cacheKey = `${CACHE_PREFIX.SUBSCRIPTION}${orgId}`;
  const cached = cacheService.get<SubContext>(cacheKey);
  if (cached) return cached;

  const sub = await prisma.subscription.findUnique({
    where: { organizationId: orgId },
  });
  if (!sub) return null;

  // Vérifier expiration annuelle
  if (sub.currentPeriodEnd && sub.status !== 'EXPIRED' && sub.status !== 'CANCELLED') {
    const now = new Date();
    if (now > new Date(sub.currentPeriodEnd)) {
      logger.info(`Abonnement expiré pour org ${orgId}`);
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED', plan: 'FREE', creditsPerMonth: 0, creditsUsed: 0 },
      });
      sub.status = 'EXPIRED';
      sub.plan = 'FREE';
      sub.creditsPerMonth = 0;
    }
  }

  // Lazy reset mensuel des membres
  const now = new Date();
  const periodStart = new Date(sub.currentPeriodStart);
  if (now.getFullYear() !== periodStart.getFullYear() || now.getMonth() !== periodStart.getMonth()) {
    logger.info(`Lazy reset quotas pour org ${orgId}`);
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
    sub.currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const ctx: SubContext = {
    plan: sub.plan as PlanName,
    status: sub.status,
    creditsPerMonth: sub.creditsPerMonth,
    currentPeriodStart: sub.currentPeriodStart,
    currentPeriodEnd: sub.currentPeriodEnd,
  };

  cacheService.set(cacheKey, ctx, CACHE_TTL.SUBSCRIPTION);
  return ctx;
}

export function requirePlan(minPlan: PlanName) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.orgId) {
      res.status(400).json({ error: 'Organisation requise' });
      return;
    }
    try {
      const ctx = await getSubContext(req.orgId);
      if (!ctx) {
        res.status(404).json({ error: 'Abonnement introuvable' });
        return;
      }
      if (ctx.status === 'EXPIRED') {
        res.status(403).json({ error: 'Abonnement expiré. Veuillez renouveler.' });
        return;
      }
      if (!isPlanAtLeast(ctx.plan, minPlan)) {
        res.status(403).json({ error: `Plan minimum requis : ${minPlan}` });
        return;
      }
      next();
    } catch (err) {
      logger.error('Erreur vérification plan', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  };
}

/**
 * Deduction generique de credits (factorise checkCredits et checkAuditCredits).
 */
async function deductCredits(req: AuthRequest, res: Response, next: NextFunction, cost: number) {
  if (!req.orgId || !req.userId) {
    next();
    return;
  }
  try {
    const ctx = await getSubContext(req.orgId);
    if (!ctx) {
      next();
      return;
    }
    if (ctx.status === 'EXPIRED') {
      res.status(403).json({ error: 'Abonnement expiré. Veuillez renouveler.' });
      return;
    }

    if (isUnlimited(ctx.creditsPerMonth)) {
      req.quotaIncremented = false;
      next();
      return;
    }

    // FREE plan : credits totaux
    if (ctx.plan === 'FREE') {
      const affected: number = await prisma.$executeRaw`
        UPDATE organization_members
        SET "creditsUsed" = "creditsUsed" + ${cost}
        WHERE "userId" = ${req.userId}
          AND "organizationId" = ${req.orgId}
          AND "creditsUsed" + ${cost} <= (
            SELECT "creditsTotal" FROM subscriptions WHERE "organizationId" = ${req.orgId}
          )
      `;

      if (affected === 0) {
        const member = await prisma.organizationMember.findUnique({
          where: { userId_organizationId: { userId: req.userId, organizationId: req.orgId } },
          select: { creditsUsed: true },
        });
        const sub = await prisma.subscription.findUnique({
          where: { organizationId: req.orgId },
          select: { creditsTotal: true },
        });
        res.status(429).json({
          error: cost > 1 ? `Crédits insuffisants (coût: ${cost} crédits)` : 'Crédits épuisés',
          quota: { used: member?.creditsUsed || 0, limit: sub?.creditsTotal || 0, cost, plan: ctx.plan },
        });
        return;
      }

      req.quotaIncremented = true;
      cacheService.del(`${CACHE_PREFIX.SUBSCRIPTION}${req.orgId}`);
      next();
      return;
    }

    // Plans payants : credits mensuels par user
    const affected: number = await prisma.$executeRaw`
      UPDATE organization_members
      SET "creditsUsed" = "creditsUsed" + ${cost}
      WHERE "userId" = ${req.userId}
        AND "organizationId" = ${req.orgId}
        AND "creditsUsed" + ${cost} <= ${ctx.creditsPerMonth}
    `;

    if (affected === 0) {
      const member = await prisma.organizationMember.findUnique({
        where: { userId_organizationId: { userId: req.userId, organizationId: req.orgId } },
        select: { creditsUsed: true },
      });
      res.status(429).json({
        error: cost > 1 ? `Crédits mensuels insuffisants (coût: ${cost} crédits)` : 'Crédits mensuels épuisés',
        quota: { used: member?.creditsUsed || 0, limit: ctx.creditsPerMonth, cost, plan: ctx.plan },
      });
      return;
    }

    // Incrementer compteur global org (fire-and-forget)
    prisma.subscription.update({
      where: { organizationId: req.orgId },
      data: { creditsUsed: { increment: cost } },
    }).catch((err) => {
      logger.error('Echec increment compteur credits org', err);
    });

    req.quotaIncremented = true;
    cacheService.del(`${CACHE_PREFIX.SUBSCRIPTION}${req.orgId}`);
    next();
  } catch (err) {
    logger.error('Erreur vérification crédits', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/** Vérifie et décrémente 1 crédit. */
export function checkCredits(req: AuthRequest, res: Response, next: NextFunction) {
  return deductCredits(req, res, next, 1);
}

/** Vérifie et décrémente CREDITS_PER_AUDIT crédits. */
export function checkAuditCredits(req: AuthRequest, res: Response, next: NextFunction) {
  return deductCredits(req, res, next, CREDITS_PER_AUDIT);
}

export function requirePremium(req: AuthRequest, res: Response, next: NextFunction) {
  return requirePlan('PRO')(req, res, next);
}

export async function requirePaid(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.orgId) {
    res.status(400).json({ error: 'Organisation requise' });
    return;
  }
  try {
    const ctx = await getSubContext(req.orgId);
    if (!ctx) {
      res.status(404).json({ error: 'Abonnement introuvable' });
      return;
    }
    if (!isPaidPlan(ctx.plan)) {
      res.status(403).json({ error: 'Un abonnement payant est requis' });
      return;
    }
    if (ctx.status === 'EXPIRED') {
      res.status(403).json({ error: 'Abonnement expiré. Veuillez renouveler.' });
      return;
    }
    next();
  } catch (err) {
    logger.error('Erreur vérification abonnement payant', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
