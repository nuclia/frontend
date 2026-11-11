import nxPlugin from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mts';
import angularRelaxed from '../../eslint.angular-relaxed.mts';

export default [
  ...baseConfig,
  ...nxPlugin.configs['flat/angular'],
  ...nxPlugin.configs['flat/angular-template'],
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'nsi', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'nsi', style: 'kebab-case' }],
      '@angular-eslint/prefer-standalone': 'off',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-indexed-object-style': ['error', 'index-signature'],
    },
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-extra-semi': 'error',
    },
  },
  ...angularRelaxed,
];
