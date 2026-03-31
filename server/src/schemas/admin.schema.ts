import { z } from 'zod';
import { paidPlanEnum, orgIdParam } from './common.schema';

export const activateOrgBody = z.object({
  plan: paidPlanEnum,
});

export { orgIdParam };
