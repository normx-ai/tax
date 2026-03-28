import { Response, NextFunction } from 'express';
import { AuthRequest } from './keycloak-auth';
import { OrgRole, isRoleAtLeast, Permission } from '../types/permissions';

export function requireOrgRole(minRole: OrgRole) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.orgRole) {
      res.status(403).json({ error: 'Rôle organisation requis' });
      return;
    }
    if (!isRoleAtLeast(req.orgRole as OrgRole, minRole)) {
      res.status(403).json({ error: `Rôle minimum requis : ${minRole}` });
      return;
    }
    next();
  };
}

export function requireOwner(req: AuthRequest, res: Response, next: NextFunction) {
  return requireOrgRole('OWNER')(req, res, next);
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  return requireOrgRole('ADMIN')(req, res, next);
}

export function requireMember(req: AuthRequest, res: Response, next: NextFunction) {
  return requireOrgRole('MEMBER')(req, res, next);
}

export function requirePermission(permission: Permission) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.orgPermissions) {
      res.status(403).json({ error: 'Permissions non résolues' });
      return;
    }
    if (!req.orgPermissions[permission]) {
      res.status(403).json({ error: `Permission requise : ${permission}` });
      return;
    }
    next();
  };
}

export function requireAllPermissions(permissions: Permission[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.orgPermissions) {
      res.status(403).json({ error: 'Permissions non résolues' });
      return;
    }
    const missing = permissions.filter(p => !req.orgPermissions![p]);
    if (missing.length > 0) {
      res.status(403).json({ error: `Permissions manquantes : ${missing.join(', ')}` });
      return;
    }
    next();
  };
}

export function requireAnyPermission(permissions: Permission[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.orgPermissions) {
      res.status(403).json({ error: 'Permissions non résolues' });
      return;
    }
    const hasAny = permissions.some(p => req.orgPermissions![p]);
    if (!hasAny) {
      res.status(403).json({ error: `Une des permissions requises : ${permissions.join(', ')}` });
      return;
    }
    next();
  };
}
