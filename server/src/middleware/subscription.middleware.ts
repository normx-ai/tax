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
 * Pattern "check + confirm" en 2 temps pour la deduction de credits.
 *
 * ETAPE 1 - reserveCredits (middleware avant la route) :
 *   Verifie que l'utilisateur a assez de credits. Ne fait AUCUNE ecriture DB.
 *   Attache req.pendingCreditCost au cas ou la route voudra confirmer apres succes.
 *
 * ETAPE 2 - confirmCreditUsage (appele par la route apres succes) :
 *   Execute une transaction Prisma qui :
 *     (a) UPDATE organization_members avec verification atomique du quota
 *     (b) UPDATE subscription.creditsUsed (compteur global, plans payants uniquement)
 *   Les deux ecritures sont rollback automatiquement si l'une echoue.
 *
 * AVANTAGES vs l'ancienne approche "deduct before" :
 *   - Les credits ne sont jamais consommes si le travail (ex: chat IA) echoue
 *   - Les deux compteurs (member + subscription) restent coherents meme en cas de crash
 *   - Plus de divergence silencieuse entre les tables
 */

async function reserveCreditsInternal(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
  cost: number,
) {
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
      req.pendingCreditCost = 0; // rien a confirmer
      req.pendingCreditPlan = ctx.plan;
      next();
      return;
    }

    // Verification de disponibilite SANS ecriture DB
    const member = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId: req.userId, organizationId: req.orgId } },
      select: { creditsUsed: true },
    });
    const used = member?.creditsUsed || 0;

    if (ctx.plan === 'FREE') {
      const sub = await prisma.subscription.findUnique({
        where: { organizationId: req.orgId },
        select: { creditsTotal: true },
      });
      const limit = sub?.creditsTotal || 0;
      if (used + cost > limit) {
        res.status(429).json({
          error: cost > 1 ? `Crédits insuffisants (coût: ${cost} crédits)` : 'Crédits épuisés',
          quota: { used, limit, cost, plan: ctx.plan },
        });
        return;
      }
    } else {
      if (used + cost > ctx.creditsPerMonth) {
        res.status(429).json({
          error: cost > 1 ? `Crédits mensuels insuffisants (coût: ${cost} crédits)` : 'Crédits mensuels épuisés',
          quota: { used, limit: ctx.creditsPerMonth, cost, plan: ctx.plan },
        });
        return;
      }
    }

    // Reserve ok : on attache le cout pour que la route puisse confirmer apres succes
    req.pendingCreditCost = cost;
    req.pendingCreditPlan = ctx.plan;
    next();
  } catch (err) {
    logger.error('Erreur verification credits', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * A appeler par la route APRES le succes du travail (ex: apres le 'done' event
 * du stream chat). Execute la deduction reelle dans une transaction Prisma.
 *
 * Si insufficientCredits est throw par le WHERE atomique, c'est qu'une autre
 * requete a consomme le credit entre-temps (race tres rare) : on log et on
 * retourne false. La route doit alors decider si elle considere la reponse
 * comme livree ou non.
 */
export async function confirmCreditUsage(req: AuthRequest): Promise<boolean> {
  if (req.quotaIncremented) return true; // deja confirme, idempotent
  if (!req.pendingCreditCost || req.pendingCreditCost === 0) return true;
  if (!req.orgId || !req.userId) return true;

  const cost = req.pendingCreditCost;
  const plan = req.pendingCreditPlan || 'FREE';
  const orgId = req.orgId;
  const userId = req.userId;

  try {
    await prisma.$transaction(async (tx) => {
      if (plan === 'FREE') {
        // Plan FREE : credits totaux, limite dans subscriptions.creditsTotal
        const affected: number = await tx.$executeRaw`
          UPDATE organization_members
          SET "creditsUsed" = "creditsUsed" + ${cost}
          WHERE "userId" = ${userId}
            AND "organizationId" = ${orgId}
            AND "creditsUsed" + ${cost} <= (
              SELECT "creditsTotal" FROM subscriptions WHERE "organizationId" = ${orgId}
            )
        `;
        if (affected === 0) {
          throw new Error('RACE_CONDITION_QUOTA_EXCEEDED');
        }
      } else {
        // Plans payants : credits mensuels par user + compteur global org
        const affected: number = await tx.$executeRaw`
          UPDATE organization_members
          SET "creditsUsed" = "creditsUsed" + ${cost}
          WHERE "userId" = ${userId}
            AND "organizationId" = ${orgId}
            AND "creditsUsed" + ${cost} <= (
              SELECT "creditsPerMonth" FROM subscriptions WHERE "organizationId" = ${orgId}
            )
        `;
        if (affected === 0) {
          throw new Error('RACE_CONDITION_QUOTA_EXCEEDED');
        }

        // Compteur global de l'organisation (dans la meme transaction)
        await tx.subscription.update({
          where: { organizationId: orgId },
          data: { creditsUsed: { increment: cost } },
        });
      }
    });

    req.quotaIncremented = true;
    req.pendingCreditCost = 0;
    cacheService.del(`${CACHE_PREFIX.SUBSCRIPTION}${orgId}`);
    return true;
  } catch (err) {
    if (err instanceof Error && err.message === 'RACE_CONDITION_QUOTA_EXCEEDED') {
      // Cas rare : le quota a ete consomme par une autre requete simultanee
      // entre le reserve et le confirm. On log mais on ne bloque pas la reponse
      // deja livree au client (c'est du travail perdu cote coute API mais la
      // reponse est envoyee).
      logger.warn('Race condition sur quota credits (reservation perdue)', { orgId, userId, cost });
      return false;
    }
    logger.error('Erreur confirmation credits', err);
    return false;
  }
}

/** Verifie et reserve 1 credit. La route doit appeler confirmCreditUsage(req) apres succes. */
export function checkCredits(req: AuthRequest, res: Response, next: NextFunction) {
  return reserveCreditsInternal(req, res, next, 1);
}

/** Verifie et reserve CREDITS_PER_AUDIT credits. La route doit appeler confirmCreditUsage(req) apres succes. */
export function checkAuditCredits(req: AuthRequest, res: Response, next: NextFunction) {
  return reserveCreditsInternal(req, res, next, CREDITS_PER_AUDIT);
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
