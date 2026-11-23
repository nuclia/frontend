// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import nx from '@nx/eslint-plugin';
import baseConfig from '../../../../../eslint.config.mjs';

export default [
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'hlm',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'hlm',
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/no-input-rename': 'off',
      '@nx/enforce-module-boundaries': (() => {
        const r = baseConfig.find((c) => c.rules && c.rules['@nx/enforce-module-boundaries'])?.rules[
          '@nx/enforce-module-boundaries'
        ];
        return r ? [r[0], { ...r[1], allowCircularSelfDependency: true }] : undefined;
      })(),
      '@angular-eslint/directive-class-suffix': 'off',
      '@angular-eslint/component-class-suffix': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'classProperty',
          modifiers: ['protected'],
          format: ['camelCase'],
          leadingUnderscore: 'require',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    // Override or add rules here
    rules: {
      '@angular-eslint/template/interactive-supports-focus': 'off',
      '@angular-eslint/template/click-events-have-key-events': 'off',
    },
  },
];
