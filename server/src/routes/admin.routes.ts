import { z } from 'zod';
import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/keycloak-auth';
import { requireAdmin } from '../middleware/requireAdmin';
import { validate } from '../middleware/validate.middleware';
import { activateOrgBody, orgIdParam } from '../schemas/admin.schema';
import { rejectSeatsBody } from '../schemas/subscription.schema';
import { uuidParam } from '../schemas/common.schema';
import prisma from '../utils/prisma';
import * as subscriptionService from '../services/subscription.service';
import { PlanName, calculateTotalPrice, getUnitPrice } from '../types/plans';
import { AuditService } from '../services/audit.service';
import { getClientIp } from '../utils/ip';
import { createLogger } from '../utils/logger';

const logger = createLogger('AdminRoutes');
const router = Router();

/**
 * @swagger
 * /api/admin/organizations:
 *   get:
 *     tags: [Admin]
 *     summary: Liste de toutes les organisations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des organisations avec abonnements et membres
 */
router.get('/organizations', requireAuth, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const organizations = await prisma.organization.findMany({
      where: { deletedAt: null },
      include: {
        subscription: true,
        _count: {
          select: { members: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = organizations.map((org) => {
      const memberCount = org._count.members;
      const plan = (org.subscription?.plan || 'FREE') as PlanName;
      const paidSeats = org.subscription?.paidSeats || memberCount;
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        createdAt: org.createdAt,
        memberCount,
        totalPrice: calculateTotalPrice(plan, paidSeats),
        unitPrice: getUnitPrice(plan, paidSeats),
        subscription: org.subscription
          ? {
              id: org.subscription.id,
              plan: org.subscription.plan,
              status: org.subscription.status,
              questionsUsed: org.subscription.questionsUsed,
              questionsPerMonth: org.subscription.questionsPerMonth,
              maxMembers: org.subscription.maxMembers,
              paidSeats: org.subscription.paidSeats,
              currentPeriodStart: org.subscription.currentPeriodStart,
              currentPeriodEnd: org.subscription.currentPeriodEnd,
              trialEndsAt: org.subscription.trialEndsAt,
            }
          : null,
      };
    });

    logger.info(`Liste admin : ${result.length} organisations`);
    res.json(result);
  } catch (err) {
    logger.error('Erreur lors de la recuperation des organisations', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * @swagger
 * /api/admin/organizations/{orgId}/activate:
 *   post:
 *     tags: [Admin]
 *     summary: Activer l'abonnement d'une organisation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [BASIQUE, PRO]
 *     responses:
 *       200:
 *         description: Abonnement activé
 */
router.post('/organizations/:orgId/activate', requireAuth, requireAdmin, validate({ params: orgIdParam, body: activateOrgBody }), async (req: AuthRequest, res: Response) => {
  try {
    const orgId = String(req.params.orgId);
    const { plan, paidSeats } = req.body;

    const updated = await subscriptionService.activateSubscription(orgId, plan, paidSeats);
    logger.info(`Admin ${req.userEmail} a active le plan ${plan} pour l'org ${orgId}`);

    res.json({
      message: `Abonnement ${plan} active pour 1 an`,
      subscription: updated,
    });
  } catch (err) {
    logger.error('Erreur activation abonnement (admin)', err);
    const msg = err instanceof Error ? err.message : 'Erreur serveur';
    if (msg.includes('introuvable') || msg.includes('gratuit')) {
      res.status(400).json({ error: msg });
      return;
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * @swagger
 * /api/admin/organizations/{orgId}/renew:
 *   post:
 *     tags: [Admin]
 *     summary: Renouveler l'abonnement d'une organisation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Abonnement renouvelé
 */
router.post('/organizations/:orgId/renew', requireAuth, requireAdmin, validate({ params: orgIdParam }), async (req: AuthRequest, res: Response) => {
  try {
    const orgId = String(req.params.orgId);

    const updated = await subscriptionService.renewSubscription(orgId);
    logger.info(`Admin ${req.userEmail} a renouvele l'abonnement pour l'org ${orgId}`);

    res.json({
      message: 'Abonnement renouvele pour 1 an',
      subscription: updated,
    });
  } catch (err) {
    logger.error('Erreur renouvellement abonnement (admin)', err);
    const msg = err instanceof Error ? err.message : 'Erreur serveur';
    if (msg.includes('introuvable') || msg.includes('gratuit')) {
      res.status(400).json({ error: msg });
      return;
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== SEAT REQUESTS ====================

const requestIdParam = z.object({ requestId: uuidParam });

/**
 * @swagger
 * /api/admin/seat-requests:
 *   get:
 *     tags: [Admin]
 *     summary: Lister les demandes de sièges en attente
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des demandes PENDING
 */
router.get('/seat-requests', requireAuth, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const requests = await subscriptionService.getPendingSeatsRequests();
    res.json(requests);
  } catch (err) {
    logger.error('Erreur lors de la récupération des demandes de sièges', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * @swagger
 * /api/admin/seat-requests/{requestId}/approve:
 *   post:
 *     tags: [Admin]
 *     summary: Approuver une demande de sièges
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Demande approuvée
 */
router.post('/seat-requests/:requestId/approve', requireAuth, requireAdmin, validate({ params: requestIdParam }), async (req: AuthRequest, res: Response) => {
  try {
    const requestId = String(req.params.requestId);
    const result = await subscriptionService.approveSeatsRequest(requestId, req.userId!);
    AuditService.log({ actorId: req.userId!, actorEmail: req.userEmail!, action: 'SEATS_APPROVED', entityType: 'SeatRequest', entityId: requestId, organizationId: result.organizationId, ipAddress: getClientIp(req), changes: { additionalSeats: result.additionalSeats } });
    res.json({ message: 'Demande approuvée', request: result });
  } catch (err) {
    logger.error('Erreur approbation demande de sièges', err);
    const msg = err instanceof Error ? err.message : 'Erreur serveur';
    if (msg.includes('introuvable') || msg.includes('déjà')) {
      res.status(400).json({ error: msg });
      return;
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * @swagger
 * /api/admin/seat-requests/{requestId}/reject:
 *   post:
 *     tags: [Admin]
 *     summary: Rejeter une demande de sièges
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Demande rejetée
 */
router.post('/seat-requests/:requestId/reject', requireAuth, requireAdmin, validate({ params: requestIdParam, body: rejectSeatsBody }), async (req: AuthRequest, res: Response) => {
  try {
    const requestId = String(req.params.requestId);
    const result = await subscriptionService.rejectSeatsRequest(requestId, req.userId!, req.body.note);
    AuditService.log({ actorId: req.userId!, actorEmail: req.userEmail!, action: 'SEATS_REJECTED', entityType: 'SeatRequest', entityId: requestId, organizationId: result.organizationId, ipAddress: getClientIp(req), changes: { adminNote: req.body.note } });
    res.json({ message: 'Demande rejetée', request: result });
  } catch (err) {
    logger.error('Erreur rejet demande de sièges', err);
    const msg = err instanceof Error ? err.message : 'Erreur serveur';
    if (msg.includes('introuvable') || msg.includes('déjà')) {
      res.status(400).json({ error: msg });
      return;
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/admin/organizations/:id/credit-questions — Créditer des questions (pack add-on)
router.post('/organizations/:id/credit-questions', requireAuth, requireAdmin, validate({ params: orgIdParam }), async (req: AuthRequest, res: Response) => {
  try {
    const orgId = String(req.params.id);
    const qty = parseInt(req.body.amount, 10);
    if (!qty || qty < 1) {
      res.status(400).json({ error: 'Nombre de questions requis (amount)' });
      return;
    }

    await prisma.subscription.update({
      where: { organizationId: orgId },
      data: { questionsPerMonth: { increment: qty } },
    });

    AuditService.log({ actorId: req.userId!, actorEmail: req.userEmail || '', action: 'SUBSCRIPTION_UPDATED', entityType: 'Subscription', entityId: orgId, organizationId: orgId, ipAddress: getClientIp(req) as string, changes: { type: 'credit_questions', amount: qty } });

    res.json({ message: `${qty} questions créditées` });
  } catch (err) {
    logger.error('Erreur crédit questions', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/admin/organizations/:id/credit-audits — Créditer des audits (pack add-on)
router.post('/organizations/:id/credit-audits', requireAuth, requireAdmin, validate({ params: orgIdParam }), async (req: AuthRequest, res: Response) => {
  try {
    const orgId = String(req.params.id);
    const qty = parseInt(req.body.amount, 10);
    if (!qty || qty < 1) {
      res.status(400).json({ error: 'Nombre d\'audits requis (amount)' });
      return;
    }

    // Créditer en augmentant le questionsPerMonth (utilisé comme crédit général)
    await prisma.subscription.update({
      where: { organizationId: orgId },
      data: { questionsPerMonth: { increment: qty } },
    });

    AuditService.log({ actorId: req.userId!, actorEmail: req.userEmail || '', action: 'SUBSCRIPTION_UPDATED', entityType: 'Subscription', entityId: orgId, organizationId: orgId, ipAddress: getClientIp(req) as string, changes: { type: 'credit_audits', amount: qty } });

    res.json({ message: `${qty} audits crédités` });
  } catch (err) {
    logger.error('Erreur crédit audits', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
