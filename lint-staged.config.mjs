export default {
  '**/*.{js,ts,jsx,tsx}': ['eslint --fix', 'prettier --write'],
  '**/*.{json,yml,yaml,css,md}': ['prettier --write'],
};
