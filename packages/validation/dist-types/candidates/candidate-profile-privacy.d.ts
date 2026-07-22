import { z } from 'zod';
export declare const candidateProfilePrivacySchema: z.ZodObject<
  {
    overallDiscoverability: z.ZodEnum<['PRIVATE', 'LINK_ONLY', 'PLATFORM_DISCOVERABLE']>;
    sections: z.ZodObject<
      {
        [k: string]: z.ZodEnum<['HIDDEN', 'PLATFORM_ONLY', 'PUBLIC']>;
      },
      'strict',
      z.ZodTypeAny,
      {
        [x: string]: 'HIDDEN' | 'PLATFORM_ONLY' | 'PUBLIC';
      },
      {
        [x: string]: 'HIDDEN' | 'PLATFORM_ONLY' | 'PUBLIC';
      }
    >;
  },
  'strict',
  z.ZodTypeAny,
  {
    overallDiscoverability: 'PRIVATE' | 'LINK_ONLY' | 'PLATFORM_DISCOVERABLE';
    sections: {
      [x: string]: 'HIDDEN' | 'PLATFORM_ONLY' | 'PUBLIC';
    };
  },
  {
    overallDiscoverability: 'PRIVATE' | 'LINK_ONLY' | 'PLATFORM_DISCOVERABLE';
    sections: {
      [x: string]: 'HIDDEN' | 'PLATFORM_ONLY' | 'PUBLIC';
    };
  }
>;
export type CandidateProfilePrivacyInput = z.infer<typeof candidateProfilePrivacySchema>;
//# sourceMappingURL=candidate-profile-privacy.d.ts.map
