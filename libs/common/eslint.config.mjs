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
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'stf', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'stf', style: 'kebab-case' }],
    },
  },
  ...angularRelaxed,
];
