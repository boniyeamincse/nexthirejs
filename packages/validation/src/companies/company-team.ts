import { z } from 'zod';
import { COMPANY_INVITABLE_ROLES } from '@nexthire/constants';
import { emailSchema } from '../common.js';

export const createCompanyInvitationSchema = z
  .object({
    email: emailSchema,
    role: z.enum(COMPANY_INVITABLE_ROLES),
  })
  .strict();

export const updateCompanyMemberRoleSchema = z
  .object({
    role: z.enum(COMPANY_INVITABLE_ROLES),
  })
  .strict();
