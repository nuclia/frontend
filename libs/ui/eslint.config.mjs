// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mts';

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
          prefix: ['ui', 'hlm'],
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: ['ui', 'hlm'],
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    // Override or add rules here
    rules: {},
  },
  {
    files: ['src/lib/spartan-components/**/*.ts'],
    rules: {
      '@nx/enforce-module-boundaries': ['error', { allowCircularSelfDependency: true }],
      '@angular-eslint/no-input-rename': ['warn'],
    },
  },

  {
    files: ['src/lib/spartan-components/**/*.html'],
    // Override or add rules here
    rules: {
      '@angular-eslint/template/click-events-have-key-events': ['warn'],
      '@angular-eslint/template/interactive-supports-focus': ['warn'],
    },
  },
];
