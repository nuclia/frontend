import baseConfig from '../../eslint.config.mts';
import svelte from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';

export default [
  ...baseConfig,
  ...svelte.configs['flat/recommended'],
  ...svelte.configs['flat/prettier'],
  {
    files: ['libs/search-widget/**/*.svelte'],
    languageOptions: {
      parser: svelte.parser,
      parserOptions: {
        parser: tseslint.parser,
        project: 'libs/search-widget/tsconfig.*?.json',
        extraFileExtensions: ['.svelte'],
      },
    },
  },
];