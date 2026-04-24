import nodemailer from 'nodemailer';
import { createLogger } from '../utils/logger';

const logger = createLogger('EmailService');

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM_ADDRESS = process.env.SMTP_FROM || 'no-reply@normx-ai.com';
const SMTP_FROM = `NORMX Tax <${SMTP_FROM_ADDRESS}>`;
const SMTP_REPLY_TO = process.env.SMTP_REPLY_TO || 'support@normx-ai.com';

const isSmtpConfigured = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter: nodemailer.Transporter | null = null;

if (isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  logger.info(`SMTP configuré : ${SMTP_HOST}:${SMTP_PORT}`);
} else {
  logger.warn('SMTP non configuré — les emails seront affichés en console');
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '  - ')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<td[^>]*>/gi, ' ')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>[^<]*<\/a>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#?\w+;/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface MailAttachment {
  filename: string;
  path: string;
  contentType?: string;
}

async function sendMail(to: string, subject: string, html: string, attachments?: MailAttachment[]): Promise<void> {
  const text = htmlToPlainText(html);

  if (transporter) {
    await transporter.sendMail({
      from: SMTP_FROM,
      replyTo: SMTP_REPLY_TO,
      to,
      subject,
      html,
      text,
      attachments,
      headers: {
        'X-Mailer': 'NORMX-Tax',
      },
    });
    logger.info(`Email envoyé à ${to} : ${subject}`);
  } else {
    logger.info(`[EMAIL FALLBACK] À: ${to} | Sujet: ${subject}`);
    logger.info(`[EMAIL FALLBACK] Contenu:\n${text}`);
    if (attachments?.length) logger.info(`[EMAIL FALLBACK] Pièces jointes: ${attachments.map(a => a.filename).join(', ')}`);
  }
}

export class EmailService {
  /**
   * Template email generique avec le style NORMX Tax
   */
  private static emailLayout(content: string): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /></head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f5f7; padding: 32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%;">

        <!-- Header -->
        <tr>
          <td style="background-color: #1A3A5C; padding: 28px 32px; text-align: center;">
            <img src="https://normx-ai.com/img/logo-horizontal-white.png" alt="NORMX AI" width="240" height="60" style="display: inline-block; border: 0; outline: none; text-decoration: none; height: 60px; width: 240px; max-width: 100%;" />
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background-color: #ffffff; padding: 32px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #f9fafb; padding: 20px 32px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; font-size: 11px; color: #9ca3af; font-weight: bold;">POUR VOTRE SÉCURITÉ :</p>
            <p style="margin: 0; font-size: 11px; color: #9ca3af; line-height: 18px;">
              Vérifiez toujours le nom et l'adresse de l'expéditeur des messages avant de les ouvrir.<br/>
              Ne communiquez jamais votre code de vérification à un tiers.<br/>
              NORMX AI ne vous demandera jamais votre mot de passe par email.
            </p>
          </td>
        </tr>

        <!-- Mentions legales societe -->
        <tr>
          <td style="padding: 16px 32px; text-align: center;">
            <p style="margin: 0 0 6px 0; font-size: 11px; color: #6b7280; line-height: 18px;">
              <strong>NORMX AI SAS</strong> — SAS au capital de 1 000 EUR<br/>
              Siege social : 71 rue Daire, 80000 Amiens, France<br/>
              RCS Amiens 2026 B 00524 — SIREN 103 831 921
            </p>
            <p style="margin: 0; font-size: 11px; color: #9ca3af;">
              info-contact@normx-ai.com · normx-ai.com · &copy; ${new Date().getFullYear()} NORMX AI
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  static async sendOtp(email: string, otp: string): Promise<void> {
    const subject = 'NORMX Tax — Votre code de verification';
    const html = EmailService.emailLayout(`
      <p style="margin: 0 0 16px 0; font-size: 15px; color: #374151;">Bonjour,</p>

      <p style="margin: 0 0 24px 0; font-size: 15px; color: #374151; line-height: 24px;">
        Pour sécuriser votre connexion à votre espace NORMX Tax, voici votre code de vérification :
      </p>

      <div style="background-color: #fef9ee; border: 2px solid #D4A843; padding: 24px; text-align: center; margin: 0 0 24px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #D4A843;">${otp}</span>
      </div>

      <p style="margin: 0 0 20px 0; font-size: 14px; color: #dc2626; font-weight: 600;">
        ⏱ Attention : ce code est valable pendant 10 minutes.
      </p>

      <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; line-height: 22px;">
        Si vous n'êtes pas à l'origine de cette connexion, nous vous invitons à :
      </p>
      <ul style="margin: 0 0 24px 0; padding-left: 20px; font-size: 14px; color: #6b7280; line-height: 22px;">
        <li>Changer votre mot de passe immédiatement</li>
        <li>Vérifier l'activité récente de votre compte</li>
      </ul>

      <p style="margin: 0; font-size: 15px; color: #374151; line-height: 24px;">
        A bientot sur NORMX Tax,<br/>
        <strong>L'équipe NORMX AI</strong>
      </p>
    `);
    await sendMail(email, subject, html);
  }

  static async sendPasswordReset(email: string, code: string): Promise<void> {
    const subject = 'NORMX Tax — Reinitialisation de mot de passe';
    const html = EmailService.emailLayout(`
      <p style="margin: 0 0 16px 0; font-size: 15px; color: #374151;">Bonjour,</p>

      <p style="margin: 0 0 24px 0; font-size: 15px; color: #374151; line-height: 24px;">
        Vous avez demandé une réinitialisation de mot de passe pour votre compte NORMX Tax. Voici votre code :
      </p>

      <div style="background-color: #fef9ee; border: 2px solid #D4A843; padding: 24px; text-align: center; margin: 0 0 24px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #D4A843;">${code}</span>
      </div>

      <p style="margin: 0 0 20px 0; font-size: 14px; color: #dc2626; font-weight: 600;">
        ⏱ Attention : ce code est valable pendant 15 minutes.
      </p>

      <p style="margin: 0 0 24px 0; font-size: 14px; color: #6b7280; line-height: 22px;">
        Si vous n'avez pas fait cette demande, ignorez simplement cet email. Votre mot de passe restera inchangé.
      </p>

      <p style="margin: 0; font-size: 15px; color: #374151; line-height: 24px;">
        A bientot sur NORMX Tax,<br/>
        <strong>L'équipe NORMX AI</strong>
      </p>
    `);
    await sendMail(email, subject, html);
  }

  static async sendInvitation(email: string, organizationName: string, inviterName: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3004';
    const inviteUrl = `${frontendUrl}/register?invitation=${token}`;
    const subject = `NORMX Tax — Invitation a rejoindre ${escapeHtml(organizationName)}`;
    const html = EmailService.emailLayout(`
      <p style="margin: 0 0 16px 0; font-size: 15px; color: #374151;">Bonjour,</p>

      <p style="margin: 0 0 24px 0; font-size: 15px; color: #374151; line-height: 24px;">
        <strong>${escapeHtml(inviterName)}</strong> vous invite à rejoindre l'organisation <strong>${escapeHtml(organizationName)}</strong> sur NORMX Tax.
      </p>

      <div style="text-align: center; margin: 0 0 24px 0;">
        <a href="${inviteUrl}" style="display: inline-block; background-color: #D4A843; color: #ffffff; padding: 14px 32px; font-size: 15px; font-weight: bold; text-decoration: none;">
          Rejoindre l'équipe
        </a>
      </div>

      <p style="margin: 0 0 12px 0; font-size: 13px; color: #6b7280; line-height: 20px;">
        Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :
      </p>
      <p style="margin: 0 0 24px 0; font-size: 12px; color: #D4A843; word-break: break-all;">
        ${inviteUrl}
      </p>

      <p style="margin: 0 0 12px 0; font-size: 13px; color: #6b7280; line-height: 20px;">
        Cette invitation expire dans 7 jours. Si vous n'attendiez pas cette invitation, ignorez cet email.
      </p>

      <p style="margin: 0; font-size: 15px; color: #374151; line-height: 24px;">
        A bientot sur NORMX Tax,<br/>
        <strong>L'équipe NORMX AI</strong>
      </p>
    `);
    await sendMail(email, subject, html);
  }

  static async sendSubscriptionReminder(
    email: string,
    organizationName: string,
    plan: string,
    expiryDate: string,
    daysLeft: number,
  ): Promise<void> {
    const urgency = daysLeft <= 1 ? '#dc2626' : daysLeft <= 7 ? '#d97706' : '#3b82f6';
    const urgencyLabel = daysLeft === 0 ? "aujourd'hui" : `dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`;
    const subject = `NORMX Tax — Votre abonnement ${plan} expire ${urgencyLabel}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1a56db;">NORMX Tax — Intelligence Fiscale</h2>
        <div style="background: ${urgency}10; border-left: 4px solid ${urgency}; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: ${urgency}; font-weight: bold;">
            Votre abonnement ${plan} pour ${organizationName} expire ${urgencyLabel}.
          </p>
        </div>
        <p>Date d'expiration : <strong>${expiryDate}</strong></p>
        <p>Sans renouvellement, votre organisation sera basculée sur le plan Gratuit avec un accès limité.</p>
        <p>Contactez votre administrateur pour procéder au renouvellement.</p>
        <p style="color: #6b7280; font-size: 14px;">NORMX Tax — CGI 2026 Republique du Congo</p>
      </div>
    `;
    await sendMail(email, subject, html);
  }

  static async sendFiscalDeadlineReminder(
    email: string,
    deadlines: string[],
  ): Promise<void> {
    const subject = `NORMX Tax — Echeances fiscales a venir (${deadlines.length})`;
    const deadlineList = deadlines.map(d => `<li style="padding: 4px 0;">${d}</li>`).join('');
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1a56db;">NORMX Tax — Intelligence Fiscale</h2>
        <p>Les échéances fiscales suivantes arrivent dans les <strong>7 prochains jours</strong> :</p>
        <div style="background: #fffbeb; border-left: 4px solid #d97706; padding: 16px; margin: 20px 0;">
          <ul style="margin: 0; padding-left: 20px; color: #374151;">
            ${deadlineList}
          </ul>
        </div>
        <p>Assurez-vous que vos déclarations et paiements sont prêts.</p>
        <p style="color: #6b7280; font-size: 14px;">Consultez l'application NORMX Tax pour plus de détails sur les articles correspondants.</p>
      </div>
    `;
    await sendMail(email, subject, html);
  }

  static async sendSeatRequestNotification(
    adminEmail: string,
    orgName: string,
    requesterName: string,
    additionalSeats: number,
    unitPrice: number,
    totalPrice: number,
    plan: string,
  ): Promise<void> {
    const subject = `NORMX Tax — Demande de ${additionalSeats} siege(s) pour ${orgName}`;
    const html = EmailService.emailLayout(`
      <p style="margin: 0 0 16px 0; font-size: 15px; color: #374151;">Bonjour,</p>

      <p style="margin: 0 0 24px 0; font-size: 15px; color: #374151; line-height: 24px;">
        <strong>${requesterName}</strong> a demandé <strong>${additionalSeats} siège(s) supplémentaire(s)</strong> pour l'organisation <strong>${orgName}</strong>.
      </p>

      <div style="background-color: #fef9ee; border: 2px solid #D4A843; padding: 20px; margin: 0 0 24px 0;">
        <table style="width: 100%; font-size: 14px; color: #374151;">
          <tr><td style="padding: 4px 0;">Plan</td><td style="text-align: right; font-weight: bold;">${plan}</td></tr>
          <tr><td style="padding: 4px 0;">Sièges demandés</td><td style="text-align: right; font-weight: bold;">${additionalSeats}</td></tr>
          <tr><td style="padding: 4px 0;">Prix unitaire</td><td style="text-align: right; font-weight: bold;">${unitPrice.toLocaleString('fr-FR')} XAF</td></tr>
          <tr><td style="padding: 4px 0; border-top: 1px solid #d1d5db;">Total à payer</td><td style="text-align: right; font-weight: bold; border-top: 1px solid #d1d5db; color: #D4A843;">${totalPrice.toLocaleString('fr-FR')} XAF</td></tr>
        </table>
      </div>

      <p style="margin: 0 0 24px 0; font-size: 14px; color: #6b7280; line-height: 22px;">
        Connectez-vous à l'espace administration pour approuver ou rejeter cette demande.
      </p>

      <p style="margin: 0; font-size: 15px; color: #374151; line-height: 24px;">
        A bientot sur NORMX Tax,<br/>
        <strong>L'équipe NORMX AI</strong>
      </p>
    `);
    await sendMail(adminEmail, subject, html);
  }

  static async sendSeatRequestApproved(
    ownerEmail: string,
    orgName: string,
    additionalSeats: number,
    newTotalSeats: number,
  ): Promise<void> {
    const subject = `NORMX Tax — Vos ${additionalSeats} siege(s) ont ete approuves`;
    const html = EmailService.emailLayout(`
      <p style="margin: 0 0 16px 0; font-size: 15px; color: #374151;">Bonjour,</p>

      <p style="margin: 0 0 24px 0; font-size: 15px; color: #374151; line-height: 24px;">
        Votre demande de <strong>${additionalSeats} siège(s) supplémentaire(s)</strong> pour <strong>${orgName}</strong> a été <span style="color: #D4A843; font-weight: bold;">approuvée</span>.
      </p>

      <div style="background-color: #fef9ee; border: 2px solid #D4A843; padding: 20px; text-align: center; margin: 0 0 24px 0;">
        <span style="font-size: 24px; font-weight: bold; color: #D4A843;">${newTotalSeats} sièges</span>
        <br/>
        <span style="font-size: 13px; color: #6b7280;">disponibles dans votre organisation</span>
      </div>

      <p style="margin: 0 0 24px 0; font-size: 14px; color: #6b7280; line-height: 22px;">
        Vous pouvez dès maintenant inviter de nouveaux membres depuis l'application.
      </p>

      <p style="margin: 0; font-size: 15px; color: #374151; line-height: 24px;">
        A bientot sur NORMX Tax,<br/>
        <strong>L'équipe NORMX AI</strong>
      </p>
    `);
    await sendMail(ownerEmail, subject, html);
  }

  static async sendSeatRequestRejected(
    ownerEmail: string,
    orgName: string,
    additionalSeats: number,
    note?: string,
  ): Promise<void> {
    const subject = `NORMX Tax — Demande de sieges refusee pour ${orgName}`;
    const noteSection = note
      ? `<div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 0 0 24px 0;">
           <p style="margin: 0; font-size: 14px; color: #374151;"><strong>Motif :</strong> ${note}</p>
         </div>`
      : '';
    const html = EmailService.emailLayout(`
      <p style="margin: 0 0 16px 0; font-size: 15px; color: #374151;">Bonjour,</p>

      <p style="margin: 0 0 24px 0; font-size: 15px; color: #374151; line-height: 24px;">
        Votre demande de <strong>${additionalSeats} siège(s) supplémentaire(s)</strong> pour <strong>${orgName}</strong> a été <span style="color: #dc2626; font-weight: bold;">refusée</span>.
      </p>

      ${noteSection}

      <p style="margin: 0 0 24px 0; font-size: 14px; color: #6b7280; line-height: 22px;">
        Pour toute question, contactez notre équipe à support@normx-ai.com.
      </p>

      <p style="margin: 0; font-size: 15px; color: #374151; line-height: 24px;">
        A bientot sur NORMX Tax,<br/>
        <strong>L'équipe NORMX AI</strong>
      </p>
    `);
    await sendMail(ownerEmail, subject, html);
  }

  static async sendInvoice(
    email: string,
    customerName: string,
    invoiceNumber: string,
    amountTTC: string,
    currency: string,
    pdfPath: string,
  ): Promise<void> {
    const amount = parseFloat(amountTTC).toLocaleString('fr-FR', { minimumFractionDigits: 0 });
    const subject = `NORMX Tax — Facture ${invoiceNumber}`;
    const html = EmailService.emailLayout(`
      <p style="margin: 0 0 16px 0; font-size: 15px; color: #374151;">Bonjour ${customerName},</p>

      <p style="margin: 0 0 24px 0; font-size: 15px; color: #374151; line-height: 24px;">
        Veuillez trouver ci-joint votre facture <strong>${invoiceNumber}</strong>.
      </p>

      <div style="background-color: #fef9ee; border: 2px solid #D4A843; padding: 20px; text-align: center; margin: 0 0 24px 0;">
        <span style="font-size: 13px; color: #6b7280;">Montant total TTC</span>
        <br/>
        <span style="font-size: 28px; font-weight: bold; color: #D4A843;">${amount} ${currency}</span>
      </div>

      <p style="margin: 0 0 24px 0; font-size: 14px; color: #6b7280; line-height: 22px;">
        Pour toute question relative à cette facture, contactez-nous à facturation@normx-ai.com.
      </p>

      <p style="margin: 0; font-size: 15px; color: #374151; line-height: 24px;">
        Cordialement,<br/>
        <strong>L'équipe NORMX AI</strong>
      </p>
    `);
    await sendMail(email, subject, html, [
      { filename: `${invoiceNumber}.pdf`, path: pdfPath, contentType: 'application/pdf' },
    ]);
  }

  static async sendPasswordChanged(email: string): Promise<void> {
    const subject = 'NORMX Tax — Votre mot de passe a ete modifie';
    const now = new Date().toLocaleString('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'Africa/Brazzaville',
    });
    const html = EmailService.emailLayout(`
      <p style="margin: 0 0 16px 0; font-size: 15px; color: #374151;">Bonjour,</p>

      <p style="margin: 0 0 24px 0; font-size: 15px; color: #374151; line-height: 24px;">
        Votre mot de passe NORMX Tax a été <strong>modifié avec succès</strong> le ${now}.
      </p>

      <div style="background-color: #f0fdf4; border: 2px solid #22c55e; padding: 20px; text-align: center; margin: 0 0 24px 0;">
        <span style="font-size: 18px; font-weight: bold; color: #16a34a;">✓ Mot de passe mis à jour</span>
      </div>

      <p style="margin: 0 0 12px 0; font-size: 14px; color: #374151; line-height: 22px; font-weight: 600;">
        Si vous n'êtes pas à l'origine de cette modification :
      </p>
      <ul style="margin: 0 0 24px 0; padding-left: 20px; font-size: 14px; color: #dc2626; line-height: 24px;">
        <li>Réinitialisez immédiatement votre mot de passe depuis l'application</li>
        <li>Contactez notre support à support@normx-ai.com</li>
      </ul>

      <p style="margin: 0 0 24px 0; font-size: 13px; color: #6b7280; line-height: 20px;">
        Par mesure de sécurité, toutes vos sessions actives ont été déconnectées. Vous devrez vous reconnecter avec votre nouveau mot de passe.
      </p>

      <p style="margin: 0; font-size: 15px; color: #374151; line-height: 24px;">
        A bientot sur NORMX Tax,<br/>
        <strong>L'équipe NORMX AI</strong>
      </p>
    `);
    await sendMail(email, subject, html);
  }

  static async sendMfaEnabled(email: string): Promise<void> {
    const subject = 'NORMX Tax — Authentification a deux facteurs activee';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1a56db;">NORMX Tax — Intelligence Fiscale</h2>
        <p>L'authentification à deux facteurs (2FA) a été activée sur votre compte.</p>
        <p>Vous devrez désormais saisir un code depuis votre application d'authentification lors de chaque connexion.</p>
        <p style="color: #6b7280; font-size: 14px;">Si vous n'avez pas fait cette action, changez immédiatement votre mot de passe.</p>
      </div>
    `;
    await sendMail(email, subject, html);
  }

  static async sendGeneric(to: string, subject: string, html: string): Promise<void> {
    await sendMail(to, subject, html);
  }
}
