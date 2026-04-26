import { z } from 'zod';
import { requiredString, emailField, orgRoleEnum, uuidParam, idParam, idAndUserIdParams, idAndInvIdParams } from './common.schema';

const orgModeEnum = z.enum(['ENTREPRISE', 'CABINET']);

export const createOrgBody = z.object({
  name: requiredString('name'),
  mode: orgModeEnum.optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  website: z.string().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const updateOrgBody = z.object({
  name: z.string().optional(),
  mode: orgModeEnum.optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  website: z.string().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const setModeBody = z.object({
  mode: orgModeEnum,
});

export const inviteMemberBody = z.object({
  email: emailField,
  role: orgRoleEnum.default('MEMBER'),
});

export const changeMemberRoleBody = z.object({
  role: orgRoleEnum,
});

export const transferOwnershipBody = z.object({
  newOwnerId: uuidParam,
});

export const acceptInvitationBody = z.object({
  token: requiredString('token'),
});

export { idParam as orgIdParam, idAndUserIdParams as orgMemberParams, idAndInvIdParams as orgInvitationParams };
