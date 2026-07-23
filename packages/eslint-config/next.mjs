import base from '@nexthire/eslint-config/base';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default [
  ...base,
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // React Compiler advisory rules: keep visible as warnings, but do not
      // fail CI for the common fetch-then-setState effect pattern used across
      // existing pages. Revisit when pages migrate to a query library.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
];
