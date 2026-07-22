import { z } from 'zod';
export declare const candidateCertificationSchema: z.ZodEffects<
  z.ZodEffects<
    z.ZodObject<
      {
        name: z.ZodString;
        issuer: z.ZodString;
        issueDate: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
        expiryDate: z.ZodEffects<
          z.ZodEffects<
            z.ZodOptional<z.ZodNullable<z.ZodString>>,
            string | null | undefined,
            string | null | undefined
          >,
          string | null | undefined,
          string | null | undefined
        >;
        doesNotExpire: z.ZodBoolean;
        credentialId: z.ZodEffects<
          z.ZodOptional<z.ZodNullable<z.ZodString>>,
          string | null | undefined,
          string | null | undefined
        >;
        credentialUrl: z.ZodEffects<
          z.ZodOptional<z.ZodNullable<z.ZodString>>,
          string | null | undefined,
          string | null | undefined
        >;
      },
      'strip',
      z.ZodTypeAny,
      {
        name: string;
        issuer: string;
        issueDate: string;
        doesNotExpire: boolean;
        expiryDate?: string | null | undefined;
        credentialId?: string | null | undefined;
        credentialUrl?: string | null | undefined;
      },
      {
        name: string;
        issuer: string;
        issueDate: string;
        doesNotExpire: boolean;
        expiryDate?: string | null | undefined;
        credentialId?: string | null | undefined;
        credentialUrl?: string | null | undefined;
      }
    >,
    {
      name: string;
      issuer: string;
      issueDate: string;
      doesNotExpire: boolean;
      expiryDate?: string | null | undefined;
      credentialId?: string | null | undefined;
      credentialUrl?: string | null | undefined;
    },
    {
      name: string;
      issuer: string;
      issueDate: string;
      doesNotExpire: boolean;
      expiryDate?: string | null | undefined;
      credentialId?: string | null | undefined;
      credentialUrl?: string | null | undefined;
    }
  >,
  {
    name: string;
    issuer: string;
    issueDate: string;
    doesNotExpire: boolean;
    expiryDate?: string | null | undefined;
    credentialId?: string | null | undefined;
    credentialUrl?: string | null | undefined;
  },
  {
    name: string;
    issuer: string;
    issueDate: string;
    doesNotExpire: boolean;
    expiryDate?: string | null | undefined;
    credentialId?: string | null | undefined;
    credentialUrl?: string | null | undefined;
  }
>;
export type CreateCandidateCertificationInput = z.infer<typeof candidateCertificationSchema>;
export declare const updateCandidateCertificationSchema: z.ZodObject<
  {
    name: z.ZodOptional<z.ZodString>;
    issuer: z.ZodOptional<z.ZodString>;
    issueDate: z.ZodOptional<
      z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>
    >;
    expiryDate: z.ZodOptional<
      z.ZodEffects<
        z.ZodEffects<
          z.ZodOptional<z.ZodNullable<z.ZodString>>,
          string | null | undefined,
          string | null | undefined
        >,
        string | null | undefined,
        string | null | undefined
      >
    >;
    doesNotExpire: z.ZodOptional<z.ZodBoolean>;
    credentialId: z.ZodOptional<
      z.ZodEffects<
        z.ZodOptional<z.ZodNullable<z.ZodString>>,
        string | null | undefined,
        string | null | undefined
      >
    >;
    credentialUrl: z.ZodOptional<
      z.ZodEffects<
        z.ZodOptional<z.ZodNullable<z.ZodString>>,
        string | null | undefined,
        string | null | undefined
      >
    >;
  },
  'strip',
  z.ZodTypeAny,
  {
    name?: string | undefined;
    issuer?: string | undefined;
    issueDate?: string | undefined;
    expiryDate?: string | null | undefined;
    doesNotExpire?: boolean | undefined;
    credentialId?: string | null | undefined;
    credentialUrl?: string | null | undefined;
  },
  {
    name?: string | undefined;
    issuer?: string | undefined;
    issueDate?: string | undefined;
    expiryDate?: string | null | undefined;
    doesNotExpire?: boolean | undefined;
    credentialId?: string | null | undefined;
    credentialUrl?: string | null | undefined;
  }
>;
export type UpdateCandidateCertificationInput = z.infer<typeof updateCandidateCertificationSchema>;
export declare const reorderCandidateCertificationsSchema: z.ZodObject<
  {
    orderedIds: z.ZodEffects<z.ZodArray<z.ZodString, 'many'>, string[], string[]>;
  },
  'strip',
  z.ZodTypeAny,
  {
    orderedIds: string[];
  },
  {
    orderedIds: string[];
  }
>;
export type ReorderCandidateCertificationsInput = z.infer<
  typeof reorderCandidateCertificationsSchema
>;
//# sourceMappingURL=candidate-certifications.d.ts.map
