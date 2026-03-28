import { Response, NextFunction } from 'express';
import { AuthRequest } from './keycloak-auth';
import prisma from '../utils/prisma';
import { cacheService, CACHE_TTL, CACHE_PREFIX } from '../utils/cache';
import { ROLE_DEFAULTS, PermissionMap } from '../types/permissions';
import { createLogger } from '../utils/logger';

const logger = createLogger('TenantMiddleware');

interface TenantContext {
  orgId: string;
  orgRole: string;
  orgPermissions: PermissionMap;
}

export async function resolveTenant(req: AuthRequest, res: Response, next: NextFunction) {
  const orgHeader = req.headers['x-organization-id'];
  if (!orgHeader) {
    next();
    return;
  }

  const orgId = Array.isArray(orgHeader) ? orgHeader[0] : orgHeader;
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: 'Authentification requise' });
    return;
  }

  const cacheKey = `${CACHE_PREFIX.TENANT}${userId}:${orgId}`;
  const cached = cacheService.get<TenantContext>(cacheKey);
  if (cached) {
    req.orgId = cached.orgId;
    req.orgRole = cached.orgRole;
    req.orgPermissions = cached.orgPermissions;
    next();
    return;
  }

  try {
    const member = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
      include: { organization: true },
    });

    if (!member || member.organization.deletedAt) {
      res.status(403).json({ error: 'Accès refusé à cette organisation' });
      return;
    }

    const roleDefaults = ROLE_DEFAULTS[member.role as keyof typeof ROLE_DEFAULTS] || {};
    const customPerms = (member.permissions as PermissionMap) || {};
    const mergedPermissions: PermissionMap = { ...roleDefaults, ...customPerms };

    const context: TenantContext = {
      orgId: member.organizationId,
      orgRole: member.role,
      orgPermissions: mergedPermissions,
    };

    cacheService.set(cacheKey, context, CACHE_TTL.TENANT);

    req.orgId = context.orgId;
    req.orgRole = context.orgRole;
    req.orgPermissions = context.orgPermissions;

    next();
  } catch (err) {
    logger.error('Erreur résolution tenant', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export function requireOrg(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.orgId) {
    res.status(400).json({ error: 'Header X-Organization-ID requis' });
    return;
  }
  next();
}
