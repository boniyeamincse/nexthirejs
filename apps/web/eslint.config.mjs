import next from '@nexthire/eslint-config/next';

export default [
  ...next,
  {
    ignores: [
      'out/**',
      'build/**',
      'next-env.d.ts',
      'eslint.config.mjs',
      'postcss.config.mjs',
      'e2e/**',
      'tests/**',
    ],
  },
];
