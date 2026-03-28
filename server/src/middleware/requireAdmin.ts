import { Response, NextFunction } from 'express';
import { AuthRequest } from './keycloak-auth';
import prisma from '../utils/prisma';
import { createLogger } from '../utils/logger';
import { AuditService } from '../services/audit.service';
import { getClientIp } from '../utils/ip';

const logger = createLogger('RequireAdmin');

/**
 * Middleware admin global : verifie que l'utilisateur a le role ADMIN
 * en base de donnees. Aucun fallback — le role ADMIN doit etre attribue
 * explicitement en base via un script ou une commande SQL.
 */
export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    res.status(401).json({ error: 'Authentification requise' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      res.status(401).json({ error: 'Utilisateur introuvable' });
      return;
    }

    if (user.role === 'ADMIN') {
      next();
      return;
    }

    // Tentative refusee — logger + audit
    logger.warn(`Tentative d'acces admin refusee pour ${user.email} (role: ${user.role})`);
    AuditService.log({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'admin_access_denied',
      entityType: 'user',
      entityId: user.id,
      ipAddress: getClientIp(req),
      changes: { path: req.originalUrl },
    });

    res.status(403).json({ error: 'Acces refuse — droits administrateur requis' });
  } catch (err) {
    logger.error('Erreur verification admin:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
