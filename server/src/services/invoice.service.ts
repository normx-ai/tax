import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../utils/prisma';
import { createLogger } from '../utils/logger';
import { InvoiceStatus, InvoiceType, Prisma } from '@prisma/client';

const logger = createLogger('InvoiceService');

const TVA_RATE = 18.90; // Congo-Brazzaville

/**
 * Génère un numéro de facture séquentiel : FAC-YYYY-NNNNNN
 */
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `FAC-${year}-`;

  const last = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' },
  });

  let seq = 1;
  if (last) {
    const parts = last.invoiceNumber.split('-');
    seq = parseInt(parts[2], 10) + 1;
  }

  return `${prefix}${seq.toString().padStart(6, '0')}`;
}

interface CreateInvoiceData {
  type: InvoiceType;
  paymentId?: string;
  userId?: string;
  organizationId?: string;
  customerName: string;
  customerEmail: string;
  customerAddress?: string;
  customerPhone?: string;
  description: string;
  plan: string;
  amountHT: number;
  periodStart?: Date;
  periodEnd?: Date;
}

/**
 * Crée une facture (automatique ou manuelle)
 */
export async function createInvoice(data: CreateInvoiceData) {
  const invoiceNumber = await generateInvoiceNumber();
  const tvaRate = new Decimal(TVA_RATE);
  const amountHT = new Decimal(data.amountHT);
  const tvaAmount = amountHT.mul(tvaRate).div(100).toDecimalPlaces(2);
  const amountTTC = amountHT.add(tvaAmount);

  const invoice = await prisma.invoice.create({
    data: {
      type: data.type,
      invoiceNumber,
      paymentId: data.paymentId || undefined,
      userId: data.userId || undefined,
      organizationId: data.organizationId || undefined,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerAddress: data.customerAddress,
      customerPhone: data.customerPhone,
      description: data.description,
      plan: data.plan,
      amountHT,
      tvaRate,
      tvaAmount,
      amountTTC,
      currency: 'XAF',
      status: data.type === 'AUTOMATIC' ? 'PAID' : 'GENERATED',
      paidAt: data.type === 'AUTOMATIC' ? new Date() : undefined,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
    },
  });

  logger.info(`Facture ${invoiceNumber} créée (${data.type}) — ${amountTTC} XAF TTC`);
  return invoice;
}

/**
 * Crée une facture automatique suite à un paiement d'abonnement
 */
export async function createAutoInvoice(params: {
  paymentId: string;
  userId: string;
  organizationId: string;
  customerName: string;
  customerEmail: string;
  plan: string;
  amountHT: number;
  periodStart: Date;
  periodEnd: Date;
}) {
  return createInvoice({
    type: 'AUTOMATIC',
    ...params,
    description: `Abonnement CGI-242 — Plan ${params.plan}`,
  });
}

/**
 * Liste les factures d'un utilisateur
 */
export async function getUserInvoices(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        OR: [
          { userId },
          { organization: { members: { some: { userId } } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.invoice.count({
      where: {
        OR: [
          { userId },
          { organization: { members: { some: { userId } } } },
        ],
      },
    }),
  ]);

  return { invoices, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/**
 * Récupère une facture par ID (vérification d'accès)
 */
export async function getInvoiceById(invoiceId: string, userId?: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payment: true },
  });

  if (!invoice) throw new Error('Facture introuvable');

  // Vérification d'accès utilisateur (admin bypass via userId = undefined)
  if (userId) {
    const hasAccess = invoice.userId === userId ||
      (invoice.organizationId && await prisma.organizationMember.findFirst({
        where: { userId, organizationId: invoice.organizationId },
      }));
    if (!hasAccess) throw new Error('Accès refusé');
  }

  return invoice;
}

/**
 * Liste toutes les factures (admin)
 */
export async function getAllInvoices(page = 1, limit = 50, filters?: {
  status?: InvoiceStatus;
  type?: InvoiceType;
  search?: string;
}) {
  const skip = (page - 1) * limit;
  const where: Prisma.InvoiceWhereInput = {};

  if (filters?.status) where.status = filters.status;
  if (filters?.type) where.type = filters.type;
  if (filters?.search) {
    where.OR = [
      { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
      { customerName: { contains: filters.search, mode: 'insensitive' } },
      { customerEmail: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.invoice.count({ where }),
  ]);

  return { invoices, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/**
 * Met à jour le statut d'une facture (admin)
 */
export async function updateInvoiceStatus(invoiceId: string, status: InvoiceStatus) {
  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status,
      sentAt: status === 'SENT' ? new Date() : undefined,
      paidAt: status === 'PAID' ? new Date() : undefined,
    },
  });
  logger.info(`Facture ${invoice.invoiceNumber} → ${status}`);
  return invoice;
}

/**
 * Annule une facture (admin)
 */
export async function cancelInvoice(invoiceId: string) {
  return updateInvoiceStatus(invoiceId, 'CANCELLED');
}
