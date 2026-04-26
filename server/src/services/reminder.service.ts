// server/src/services/reminder.service.ts
// Service d'emails de rappel : expiration abonnement, renouvellement, échéances fiscales

import prisma from '../utils/prisma';
import { EmailService } from './email.service';
import { PushService } from './push.service';
import { createLogger } from '../utils/logger';
import { marquerEnRetard, envoyerRappelsDossiers } from './dossiers-rappels.service';

const logger = createLogger('ReminderService');

/**
 * Vérifie les abonnements proches de l'expiration et envoie des rappels.
 * À appeler périodiquement (cron ou setInterval).
 *
 * Rappels envoyés :
 * - 30 jours avant expiration
 * - 7 jours avant expiration
 * - 1 jour avant expiration
 * - Le jour de l'expiration
 */
export async function checkExpiringSubscriptions(): Promise<{ sent: number; errors: number }> {
  const now = new Date();
  const result = { sent: 0, errors: 0 };

  const thresholds = [
    { days: 30, label: '30 jours' },
    { days: 7, label: '7 jours' },
    { days: 1, label: '1 jour' },
    { days: 0, label: "aujourd'hui" },
  ];

  for (const threshold of thresholds) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + threshold.days);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    try {
      const subscriptions = await prisma.subscription.findMany({
        where: {
          status: { in: ['ACTIVE', 'TRIALING'] },
          plan: { not: 'FREE' },
          currentPeriodEnd: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
        include: {
          organization: {
            include: {
              members: {
                where: { role: { in: ['OWNER', 'ADMIN'] } },
                include: { user: { select: { id: true, email: true } } },
              },
            },
          },
        },
      });

      for (const sub of subscriptions) {
        if (!sub.organization) continue;

        const orgName = sub.organization.name;
        const expiryDate = sub.currentPeriodEnd
          ? new Date(sub.currentPeriodEnd).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : 'inconnue';

        // Envoyer aux OWNER et ADMIN de l'org (email + push)
        for (const member of sub.organization.members) {
          try {
            await EmailService.sendSubscriptionReminder(
              member.user.email,
              orgName,
              sub.plan,
              expiryDate,
              threshold.days,
            );

            // Push notification
            await PushService.sendSubscriptionExpiringPush(
              member.user.id,
              orgName,
              sub.plan,
              threshold.days,
            );

            result.sent++;
          } catch (err) {
            logger.error(`Erreur envoi rappel à ${member.user.email}:`, err);
            result.errors++;
          }
        }
      }
    } catch (err) {
      logger.error(`Erreur vérification seuil ${threshold.days}j:`, err);
      result.errors++;
    }
  }

  if (result.sent > 0) {
    logger.info(`Rappels envoyés: ${result.sent} emails, ${result.errors} erreurs`);
  }

  return result;
}

// ─── Calendrier fiscal complet CGI Congo 2026 ───
// Conforme Art. 461 bis (L.F. 2026) : délais fixés au 15 de chaque mois, sauf août = 20

interface FiscalDeadline {
  day: number;
  month: number; // 1-12, 0 = tous les mois (récurrent)
  label: string;
  recurrent: boolean;
}

const FISCAL_DEADLINES: FiscalDeadline[] = [
  // Obligations mensuelles récurrentes (Art. 461 bis : le 15)
  { day: 15, month: 0, label: 'ITS mensuel', recurrent: true },
  { day: 15, month: 0, label: 'TUS mensuel', recurrent: true },
  { day: 15, month: 0, label: 'Retenue à la source', recurrent: true },
  { day: 15, month: 0, label: 'IRCM mensuel', recurrent: true },
  { day: 15, month: 0, label: 'IS forfaitaire (parapétrolier)', recurrent: true },
  { day: 15, month: 0, label: 'IRCM forfaitaire (parapétrolier)', recurrent: true },
  { day: 15, month: 0, label: 'TVA mensuelle', recurrent: true },
  { day: 15, month: 0, label: 'Centimes additionnels TVA (5%)', recurrent: true },
  { day: 15, month: 0, label: "Droits d'accises", recurrent: true },
  { day: 15, month: 0, label: 'CNSS mensuel', recurrent: true },
  { day: 15, month: 0, label: 'CAMU mensuel', recurrent: true },
  { day: 15, month: 0, label: 'Taxe transferts de fonds', recurrent: true },
  { day: 15, month: 0, label: "Taxe contrats d'assurance", recurrent: true },
  { day: 15, month: 0, label: 'Taxe jeux de hasard', recurrent: true },
  { day: 15, month: 0, label: 'Redevance audiovisuelle (RAV)', recurrent: true },
  { day: 15, month: 0, label: 'Taxe communications électroniques', recurrent: true },

  // Obligations spécifiques par mois
  { day: 31, month: 1, label: 'Taxe régionale (résidents)', recurrent: false },
  { day: 15, month: 3, label: 'Minimum perception IS (T1)', recurrent: false },
  { day: 15, month: 3, label: 'Déclaration IBA annuel', recurrent: false },
  { day: 15, month: 2, label: 'DAS annuelle (décl. salaires)', recurrent: false },
  { day: 20, month: 3, label: 'IGF (1er versement)', recurrent: false },
  { day: 15, month: 4, label: 'Patente annuelle', recurrent: false },
  { day: 15, month: 4, label: 'Centimes additionnels patente (5%)', recurrent: false },
  { day: 30, month: 4, label: 'Contribution foncière (CFPB/CFPNB)', recurrent: false },
  { day: 30, month: 4, label: 'Déclaration IS annuelle', recurrent: false },
  { day: 15, month: 5, label: 'IRF Loyers (1re échéance)', recurrent: false },
  { day: 15, month: 5, label: 'Solde de liquidation IS', recurrent: false },
  { day: 15, month: 5, label: 'Solde IBA annuel', recurrent: false },
  { day: 15, month: 6, label: 'Minimum perception IS (T2)', recurrent: false },
  { day: 20, month: 6, label: 'IGF (2e versement)', recurrent: false },
  { day: 20, month: 8, label: 'IRF Loyers (2e échéance)', recurrent: false },
  { day: 15, month: 9, label: 'Minimum perception IS (T3)', recurrent: false },
  { day: 20, month: 9, label: 'IGF (3e versement)', recurrent: false },
  { day: 15, month: 11, label: 'IRF Loyers (3e échéance)', recurrent: false },
  { day: 15, month: 12, label: 'Minimum perception IS (T4)', recurrent: false },
  { day: 20, month: 12, label: 'IGF (4e versement)', recurrent: false },
];

/**
 * Calcule les jours de notification pour une échéance donnée.
 * Logique : notifier tous les 2 jours en amont (en reculant depuis J-1), puis le jour J.
 *
 * Exemples :
 *   jour 15 → notifications les 10, 12, 14, 15
 *   jour 20 → notifications les 15, 17, 19, 20
 *   jour 30 → notifications les 25, 27, 29, 30
 *   jour 31 → notifications les 26, 28, 30, 31
 */
function getNotificationDays(deadlineDay: number): number[] {
  const days: number[] = [deadlineDay]; // toujours notifier le jour J
  // Reculer de 1, puis par pas de 2 (J-1, J-3, J-5)
  let d = deadlineDay - 1;
  let count = 0;
  while (count < 3 && d >= 1) {
    days.push(d);
    count++;
    d -= 2;
  }
  return days.sort((a, b) => a - b);
}

/**
 * Retourne les échéances d'un mois donné (1-12), y compris les récurrentes.
 * En août (mois 8), les obligations récurrentes passent au 20 (Art. 461 bis).
 */
function getDeadlinesForMonth(month: number): { day: number; label: string }[] {
  return FISCAL_DEADLINES
    .filter((d) => d.month === month || (d.recurrent && d.month === 0))
    .map((d) => {
      // Art. 461 bis : en août, le délai passe au 20
      if (d.recurrent && month === 8 && d.day === 15) {
        return { day: 20, label: d.label };
      }
      return { day: d.day, label: d.label };
    });
}

/**
 * Vérifie les échéances fiscales à venir et envoie des rappels.
 *
 * Notifications tous les 2 jours avant chaque échéance :
 *   - Jour 15 → notif les 10, 12, 14, 15
 *   - Jour 20 → notif les 15, 17, 19, 20
 *   - Jour 30 → notif les 25, 27, 29, 30
 */
export async function checkFiscalDeadlines(): Promise<{ sent: number; errors: number }> {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1; // 1-12
  const result = { sent: 0, errors: 0 };

  // Récupérer les échéances du mois courant
  const monthDeadlines = getDeadlinesForMonth(currentMonth);

  // Regrouper par jour d'échéance
  const deadlinesByDay = new Map<number, string[]>();
  for (const d of monthDeadlines) {
    const list = deadlinesByDay.get(d.day) || [];
    list.push(d.label);
    deadlinesByDay.set(d.day, list);
  }

  // Vérifier si aujourd'hui est un jour de notification pour une échéance
  const deadlinesToNotify: { day: number; labels: string[] }[] = [];
  for (const [deadlineDay, labels] of deadlinesByDay) {
    const notifDays = getNotificationDays(deadlineDay);
    if (notifDays.includes(currentDay)) {
      deadlinesToNotify.push({ day: deadlineDay, labels });
    }
  }

  if (deadlinesToNotify.length === 0) return result;

  // Construire la liste complète des labels à notifier
  const allLabels = deadlinesToNotify.flatMap((d) => d.labels);
  const isDeadlineDay = deadlinesToNotify.some((d) => d.day === currentDay);
  const daysUntil = deadlinesToNotify
    .filter((d) => d.day > currentDay)
    .map((d) => d.day - currentDay);
  const minDaysUntil = daysUntil.length > 0 ? Math.min(...daysUntil) : 0;

  logger.info(
    `Jour ${currentDay}/${currentMonth} — ${allLabels.length} échéance(s) à notifier` +
    (isDeadlineDay ? ' (JOUR J)' : ` (J-${minDaysUntil})`)
  );

  try {
    // Envoyer aux OWNER/ADMIN de toutes les orgs avec abonnement actif
    const activeOrgs = await prisma.organization.findMany({
      where: {
        deletedAt: null,
        subscription: { status: 'ACTIVE', plan: { not: 'FREE' } },
      },
      include: {
        members: {
          where: { role: { in: ['OWNER', 'ADMIN'] } },
          include: { user: { select: { id: true, email: true } } },
        },
      },
    });

    for (const org of activeOrgs) {
      for (const member of org.members) {
        try {
          await EmailService.sendFiscalDeadlineReminder(
            member.user.email,
            allLabels,
          );

          // Envoyer notification push
          await PushService.sendFiscalDeadlinesPush(
            member.user.id,
            allLabels.map((label) => ({ titre: label, description: label })),
          );

          result.sent++;
        } catch (err) {
          logger.error(`Erreur envoi échéance fiscale à ${member.user.email}:`, err);
          result.errors++;
        }
      }
    }
  } catch (err) {
    logger.error('Erreur vérification échéances fiscales:', err);
    result.errors++;
  }

  if (result.sent > 0) {
    logger.info(`Rappels fiscaux envoyés: ${result.sent} (email + push)`);
  }

  return result;
}

/**
 * Démarre le cron de vérification des rappels.
 * Exécution quotidienne à 8h00.
 */
export function startReminderCron(): void {
  const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h

  // Calculer le délai jusqu'à 8h00
  const now = new Date();
  const next8am = new Date(now);
  next8am.setHours(8, 0, 0, 0);
  if (now >= next8am) {
    next8am.setDate(next8am.getDate() + 1);
  }
  const delayMs = next8am.getTime() - now.getTime();

  logger.info(`Cron rappels programmé : première exécution dans ${Math.round(delayMs / 60000)} minutes (8h00)`);

  // Premier lancement à 8h00, puis toutes les 24h
  setTimeout(() => {
    runAllReminders();
    setInterval(runAllReminders, INTERVAL_MS);
  }, delayMs);
}

async function runAllReminders(): Promise<void> {
  logger.info('Exécution des rappels quotidiens...');
  try {
    await checkExpiringSubscriptions();
    await checkFiscalDeadlines();

    // Bloc 4.2 : marquer les dossiers expires EN_RETARD puis envoyer
    // les recaps personnalises aux OWNER/ADMIN.
    await marquerEnRetard();
    await envoyerRappelsDossiers();

    // Nettoyage tokens push obsolètes le dimanche
    if (new Date().getDay() === 0) {
      await PushService.cleanupStaleTokens();
    }
  } catch (err) {
    logger.error('Erreur exécution rappels:', err);
  }
}
