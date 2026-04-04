import { Response, NextFunction } from 'express';
import { AuthRequest } from './keycloak-auth';

export function requireProductSubscription(product: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const subs = req.userSubscriptions || [];
    if (!subs.includes(product)) {
      res.status(403).json({
        error: 'Abonnement requis.',
        product,
        code: 'SUBSCRIPTION_REQUIRED',
      });
      return;
    }
    next();
  };
}
