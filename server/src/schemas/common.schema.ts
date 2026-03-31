import { z } from 'zod';

// --- Primitives ---
export const uuidParam = z.string().uuid();
export const emailField = z.string().email();
export const passwordField = z.string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Le mot de passe doit contenir au moins 1 majuscule, 1 minuscule et 1 chiffre'
  );
export const requiredString = (name: string) => z.string().min(1, `${name} est requis`);

// --- Params communs ---
export const idParam = z.object({ id: uuidParam });
export const userIdParam = z.object({ userId: uuidParam });
export const idAndUserIdParams = z.object({ id: uuidParam, userId: uuidParam });
export const idAndInvIdParams = z.object({ id: uuidParam, invId: uuidParam });
export const orgIdParam = z.object({ orgId: uuidParam });

// --- Pagination ---
export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// --- Enums ---
export const paidPlanEnum = z.enum(['STARTER', 'PRO']);
export const orgRoleEnum = z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']);
