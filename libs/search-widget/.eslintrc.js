module.exports = {
  extends: [
    '../../.eslintrc.json',
    // add more generic rule sets here, such as:
    // 'eslint:recommended',
    'plugin:svelte/recommended',
    'plugin:svelte/prettier',
  ],
  rules: {
    // override/add rules settings here, such as:
    // 'svelte/rule-name': 'error'
  },
  plugins: ['@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    // ...
    project: 'libs/search-widget/tsconfig.*?.json',
    extraFileExtensions: ['.svelte'], // This is a required setting in `@typescript-eslint/parser` v4.24.0.
  },
  overrides: [
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      // Parse the `<script>` in `.svelte` as TypeScript by adding the following configuration.
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
    },
  ],
};
