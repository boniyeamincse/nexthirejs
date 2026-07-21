import node from '@nexthire/eslint-config/node';

export default [
  ...node,
  {
    ignores: ['eslint.config.mjs', 'scripts/', 'prisma.config.ts'],
  },
];
