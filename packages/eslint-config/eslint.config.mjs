import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    ignores: ['eslint.config.mjs'],
  },
  {
    rules: {
      'no-undef': 'off',
    },
  },
];
