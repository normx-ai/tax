import { Response, NextFunction } from 'express';
import { AuthRequest } from './keycloak-auth';
import prisma from '../utils/prisma';
import { cacheService, CACHE_TTL, CACHE_PREFIX } from '../utils/cache';
import { PlanName, isPlanAtLeast, isUnlimited, isPaidPlan } from '../types/plans';
import { createLogger } from '../utils/logger';

const logger = createLogger('SubscriptionMiddleware');

interface SubContext {
  plan: PlanName;
  status: string;
  questionsPerMonth: number; // quota par user
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
        data: { status: 'EXPIRED', plan: 'FREE', questionsPerMonth: 0, questionsUsed: 0 },
      });
      sub.status = 'EXPIRED';
      sub.plan = 'FREE';
      sub.questionsPerMonth = 0;
    }
  }

  // Lazy reset mensuel des membres
  const now = new Date();
  const periodStart = new Date(sub.currentPeriodStart);
  if (now.getFullYear() !== periodStart.getFullYear() || now.getMonth() !== periodStart.getMonth()) {
    logger.info(`Lazy reset quotas pour org ${orgId}`);
    await prisma.organizationMember.updateMany({
      where: { organizationId: orgId },
      data: { questionsUsed: 0 },
    });
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        questionsUsed: 0,
        currentPeriodStart: new Date(now.getFullYear(), now.getMonth(), 1),
      },
    });
    sub.currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const ctx: SubContext = {
    plan: sub.plan as PlanName,
    status: sub.status,
    questionsPerMonth: sub.questionsPerMonth,
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
 * Vérifie et incrémente atomiquement le quota de questions de l'utilisateur (M13).
 * L'incrément conditionnel évite les dépassements en cas de requêtes simultanées.
 */
export async function checkQuestionQuota(req: AuthRequest, res: Response, next: NextFunction) {
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

    // Quota illimité → pas de vérification
    if (isUnlimited(ctx.questionsPerMonth)) {
      req.quotaIncremented = false;
      next();
      return;
    }

    // Incrément atomique conditionnel : vérifie ET incrémente en une seule requête SQL (M13)
    const affected: number = await prisma.$executeRaw`
      UPDATE organization_members
      SET "questionsUsed" = "questionsUsed" + 1
      WHERE "userId" = ${req.userId}
        AND "organizationId" = ${req.orgId}
        AND "questionsUsed" < ${ctx.questionsPerMonth}
    `;

    if (affected === 0) {
      // Soit le membre n'existe pas, soit le quota est atteint
      const member = await prisma.organizationMember.findUnique({
        where: { userId_organizationId: { userId: req.userId, organizationId: req.orgId } },
        select: { questionsUsed: true },
      });
      const userUsed = member?.questionsUsed || 0;
      res.status(429).json({
        error: 'Quota de questions atteint pour ce mois',
        quota: { used: userUsed, limit: ctx.questionsPerMonth, plan: ctx.plan },
      });
      return;
    }

    // Incrémenter aussi le compteur global org (fire-and-forget)
    prisma.subscription.update({
      where: { organizationId: req.orgId },
      data: { questionsUsed: { increment: 1 } },
    }).catch((err) => {
      logger.error('Echec increment compteur quota org', err);
    });

    // Marquer que le quota a déjà été incrémenté (évite double incrément dans chat)
    req.quotaIncremented = true;
    cacheService.del(`${CACHE_PREFIX.SUBSCRIPTION}${req.orgId}`);
    next();
  } catch (err) {
    logger.error('Erreur vérification quota', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Vérifie le quota d'audits documents par mois.
 * Basé sur le comptage des DocumentAudit créés ce mois par l'org.
 */
export async function checkAuditQuota(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.orgId) { next(); return; }
  try {
    const ctx = await getSubContext(req.orgId);
    if (!ctx) { next(); return; }
    if (ctx.status === 'EXPIRED') {
      res.status(403).json({ error: 'Abonnement expiré. Veuillez renouveler.' });
      return;
    }

    const { getPlanQuota } = require('../types/plans');
    const quota = getPlanQuota(ctx.plan);

    // FREE : quota total (pas mensuel)
    if (ctx.plan === 'FREE') {
      const totalAudits: [{ count: bigint }] = await prisma.$queryRaw`
        SELECT COUNT(*)::bigint as count FROM document_audits WHERE "orgId" = ${req.orgId}
      `;
      const used = Number(totalAudits[0]?.count ?? 0);
      if (quota.auditsTotal > 0 && used >= quota.auditsTotal) {
        res.status(429).json({ error: 'Quota d\'audits atteint', quota: { used, limit: quota.auditsTotal, plan: ctx.plan } });
        return;
      }
      next(); return;
    }

    // Plans payants : quota mensuel
    if (isUnlimited(quota.auditsPerMonth)) { next(); return; }

    const monthStart = new Date();
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const monthAudits: [{ count: bigint }] = await prisma.$queryRaw`
      SELECT COUNT(*)::bigint as count FROM document_audits
      WHERE "orgId" = ${req.orgId} AND "createdAt" >= ${monthStart}
    `;
    const used = Number(monthAudits[0]?.count ?? 0);
    if (used >= quota.auditsPerMonth) {
      res.status(429).json({ error: 'Quota d\'audits mensuel atteint', quota: { used, limit: quota.auditsPerMonth, plan: ctx.plan } });
      return;
    }
    next();
  } catch (err) {
    logger.error('Erreur vérification quota audit', err);
    next();
  }
}

/**
 * Vérifie que le plan inclut les organisations (TEAM+).
 */
export async function requireOrganizationFeature(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.orgId) { next(); return; }
  try {
    const ctx = await getSubContext(req.orgId);
    if (!ctx) { next(); return; }
    const { getPlanQuota } = require('../types/plans');
    const quota = getPlanQuota(ctx.plan);
    if (!quota.hasOrganization && ctx.plan !== 'FREE') {
      res.status(403).json({ error: 'Fonctionnalité organisation non incluse dans votre plan. Passez au plan Team.' });
      return;
    }
    next();
  } catch (err) {
    logger.error('Erreur vérification feature organisation', err);
    next();
  }
}

/**
 * Vérifie que le plan inclut les analytics (TEAM+).
 */
export async function requireAnalyticsFeature(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.orgId) { next(); return; }
  try {
    const ctx = await getSubContext(req.orgId);
    if (!ctx) { next(); return; }
    const { getPlanQuota } = require('../types/plans');
    const quota = getPlanQuota(ctx.plan);
    if (!quota.hasAnalytics) {
      res.status(403).json({ error: 'Fonctionnalité analytics non incluse dans votre plan. Passez au plan Team.' });
      return;
    }
    next();
  } catch (err) {
    logger.error('Erreur vérification feature analytics', err);
    next();
  }
}

export function requirePremium(req: AuthRequest, res: Response, next: NextFunction) {
  return requirePlan('STARTER')(req, res, next);
}

export function requireEnterprise(req: AuthRequest, res: Response, next: NextFunction) {
  return requirePlan('ENTERPRISE')(req, res, next);
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
