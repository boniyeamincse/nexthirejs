import { z } from 'zod';
import { COMPANY_LIMITS, COMPANY_SIZES } from '@nexthire/constants';

const DANGEROUS_SCHEME_REGEX = /^\s*(javascript|data|vbscript|file|blob):/i;
const HTTP_URL_REGEX = /^https?:\/\/[^\s/$.?#][^\s]*$/i;

const safeUrlSchema = z
  .string()
  .trim()
  .max(COMPANY_LIMITS.MAX_WEBSITE, `URL must not exceed ${COMPANY_LIMITS.MAX_WEBSITE} characters`)
  .refine((val) => !DANGEROUS_SCHEME_REGEX.test(val), { message: 'URL scheme is not allowed' })
  .refine((val) => HTTP_URL_REGEX.test(val), { message: 'URL must be a valid http(s) URL' })
  .nullable()
  .optional();

const optionalTrimmedString = (max: number) => z.string().trim().max(max).nullable().optional();

export const companyProfileSchema = z
  .object({
    name: z.string().trim().min(COMPANY_LIMITS.MIN_NAME).max(COMPANY_LIMITS.MAX_NAME),
    legalName: optionalTrimmedString(COMPANY_LIMITS.MAX_LEGAL_NAME),
    website: safeUrlSchema,
    industry: optionalTrimmedString(COMPANY_LIMITS.MAX_INDUSTRY),
    companySize: z.enum(COMPANY_SIZES).nullable().optional(),
    headquartersCountryId: z.string().uuid('headquartersCountryId must be a valid UUID'),
    headquartersCity: optionalTrimmedString(COMPANY_LIMITS.MAX_CITY),
    description: z
      .string()
      .trim()
      .min(COMPANY_LIMITS.MIN_DESCRIPTION)
      .max(COMPANY_LIMITS.MAX_DESCRIPTION),
  })
  .strict();

export type CompanyProfileSchemaInput = z.infer<typeof companyProfileSchema>;
