import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { requireAuth, AuthRequest } from '../middleware/keycloak-auth';
import { requireAdmin } from '../middleware/requireAdmin';
import { validate } from '../middleware/validate.middleware';
import {
  createManualInvoiceBody,
  updateInvoiceStatusBody,
  invoiceListQuery,
  invoiceIdParam,
} from '../schemas/invoice.schema';
import * as invoiceService from '../services/invoice.service';
import { generateInvoicePdf } from '../services/pdf.service';
import { EmailService } from '../services/email.service';
import { AuditService } from '../services/audit.service';
import { getClientIp } from '../utils/ip';
import { createLogger } from '../utils/logger';

const logger = createLogger('InvoiceRoutes');
const router = Router();

// ============================================================
// ROUTES UTILISATEUR
// ============================================================

/**
 * GET /api/invoices — Mes factures
 */
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = invoiceListQuery.parse(req.query);
    const result = await invoiceService.getUserInvoices(req.userId!, page, limit);
    res.json(result);
  } catch (err) {
    logger.error('Erreur liste factures utilisateur', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/invoices/:invoiceId — Détail d'une facture
 */
router.get('/:invoiceId', requireAuth, validate({ params: invoiceIdParam }), async (req: AuthRequest, res: Response) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.invoiceId as string, req.userId!);
    res.json(invoice);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur serveur';
    if (msg.includes('introuvable')) { res.status(404).json({ error: msg }); return; }
    if (msg.includes('refusé')) { res.status(403).json({ error: msg }); return; }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/invoices/:invoiceId/pdf — Télécharger le PDF
 */
router.get('/:invoiceId/pdf', requireAuth, validate({ params: invoiceIdParam }), async (req: AuthRequest, res: Response) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.invoiceId as string, req.userId!);

    // Générer le PDF à la volée s'il n'existe pas
    let pdfPath = invoice.pdfPath;
    if (!pdfPath || !fs.existsSync(pdfPath)) {
      pdfPath = await generateInvoicePdf({
        invoiceNumber: invoice.invoiceNumber,
        createdAt: invoice.createdAt,
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail,
        customerAddress: invoice.customerAddress,
        customerPhone: invoice.customerPhone,
        description: invoice.description,
        plan: invoice.plan,
        amountHT: invoice.amountHT.toString(),
        tvaRate: invoice.tvaRate.toString(),
        tvaAmount: invoice.tvaAmount.toString(),
        amountTTC: invoice.amountTTC.toString(),
        currency: invoice.currency,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd,
        paidAt: invoice.paidAt,
        status: invoice.status,
      });
    }

    res.download(pdfPath, `${invoice.invoiceNumber}.pdf`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur serveur';
    if (msg.includes('introuvable')) { res.status(404).json({ error: msg }); return; }
    if (msg.includes('refusé')) { res.status(403).json({ error: msg }); return; }
    logger.error('Erreur téléchargement PDF', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================================
// ROUTES ADMIN
// ============================================================

/**
 * GET /api/invoices/admin/all — Toutes les factures (admin)
 */
router.get('/admin/all', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, status, type, search } = invoiceListQuery.parse(req.query);
    const result = await invoiceService.getAllInvoices(page, limit, { status, type, search });
    res.json(result);
  } catch (err) {
    logger.error('Erreur liste factures admin', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/invoices/admin/create — Créer une facture manuelle (admin)
 */
router.post('/admin/create', requireAuth, requireAdmin, validate({ body: createManualInvoiceBody }), async (req: AuthRequest, res: Response) => {
  try {
    const { periodStart, periodEnd, ...rest } = req.body;
    const invoice = await invoiceService.createInvoice({
      type: 'MANUAL',
      ...rest,
      periodStart: periodStart ? new Date(periodStart) : undefined,
      periodEnd: periodEnd ? new Date(periodEnd) : undefined,
    });

    // Générer le PDF
    const pdfPath = await generateInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      createdAt: invoice.createdAt,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      customerAddress: invoice.customerAddress,
      customerPhone: invoice.customerPhone,
      description: invoice.description,
      plan: invoice.plan,
      amountHT: invoice.amountHT.toString(),
      tvaRate: invoice.tvaRate.toString(),
      tvaAmount: invoice.tvaAmount.toString(),
      amountTTC: invoice.amountTTC.toString(),
      currency: invoice.currency,
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
      paidAt: invoice.paidAt,
      status: invoice.status,
    });

    AuditService.log({
      actorId: req.userId!,
      actorEmail: req.userEmail!,
      action: 'INVOICE_CREATED',
      entityType: 'Invoice',
      entityId: invoice.id,
      ipAddress: getClientIp(req),
      changes: { type: 'MANUAL', invoiceNumber: invoice.invoiceNumber, amountTTC: invoice.amountTTC.toString() },
    });

    res.status(201).json({ message: 'Facture créée', invoice });
  } catch (err) {
    logger.error('Erreur création facture manuelle', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PATCH /api/invoices/admin/:invoiceId/status — Changer le statut (admin)
 */
router.patch('/admin/:invoiceId/status', requireAuth, requireAdmin, validate({ params: invoiceIdParam, body: updateInvoiceStatusBody }), async (req: AuthRequest, res: Response) => {
  try {
    const invoice = await invoiceService.updateInvoiceStatus(req.params.invoiceId as string, req.body.status);

    AuditService.log({
      actorId: req.userId!,
      actorEmail: req.userEmail!,
      action: 'INVOICE_UPDATED',
      entityType: 'Invoice',
      entityId: invoice.id,
      ipAddress: getClientIp(req),
      changes: { status: req.body.status },
    });

    res.json({ message: `Facture ${invoice.invoiceNumber} → ${req.body.status}`, invoice });
  } catch (err) {
    logger.error('Erreur mise à jour statut facture', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/invoices/admin/:invoiceId/send — Envoyer la facture par email (admin)
 */
router.post('/admin/:invoiceId/send', requireAuth, requireAdmin, validate({ params: invoiceIdParam }), async (req: AuthRequest, res: Response) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.invoiceId as string);

    // Générer le PDF
    const pdfPath = await generateInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      createdAt: invoice.createdAt,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      customerAddress: invoice.customerAddress,
      customerPhone: invoice.customerPhone,
      description: invoice.description,
      plan: invoice.plan,
      amountHT: invoice.amountHT.toString(),
      tvaRate: invoice.tvaRate.toString(),
      tvaAmount: invoice.tvaAmount.toString(),
      amountTTC: invoice.amountTTC.toString(),
      currency: invoice.currency,
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
      paidAt: invoice.paidAt,
      status: invoice.status,
    });

    // Envoyer par email
    await EmailService.sendInvoice(
      invoice.customerEmail,
      invoice.customerName,
      invoice.invoiceNumber,
      invoice.amountTTC.toString(),
      invoice.currency,
      pdfPath,
    );

    // Mettre à jour le statut
    await invoiceService.updateInvoiceStatus(invoice.id, 'SENT');

    AuditService.log({
      actorId: req.userId!,
      actorEmail: req.userEmail!,
      action: 'INVOICE_SENT',
      entityType: 'Invoice',
      entityId: invoice.id,
      ipAddress: getClientIp(req),
      changes: { sentTo: invoice.customerEmail },
    });

    res.json({ message: `Facture ${invoice.invoiceNumber} envoyée à ${invoice.customerEmail}` });
  } catch (err) {
    logger.error('Erreur envoi facture', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/invoices/admin/:invoiceId — Annuler une facture (admin)
 */
router.delete('/admin/:invoiceId', requireAuth, requireAdmin, validate({ params: invoiceIdParam }), async (req: AuthRequest, res: Response) => {
  try {
    const invoice = await invoiceService.cancelInvoice(req.params.invoiceId as string);

    AuditService.log({
      actorId: req.userId!,
      actorEmail: req.userEmail!,
      action: 'INVOICE_CANCELLED',
      entityType: 'Invoice',
      entityId: invoice.id,
      ipAddress: getClientIp(req),
      changes: { invoiceNumber: invoice.invoiceNumber },
    });

    res.json({ message: `Facture ${invoice.invoiceNumber} annulée`, invoice });
  } catch (err) {
    logger.error('Erreur annulation facture', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
