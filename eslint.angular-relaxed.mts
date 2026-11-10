export default [
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/component-selector': 'warn',
      '@angular-eslint/directive-selector': 'warn',
      '@angular-eslint/no-output-native': 'warn',
      '@angular-eslint/prefer-inject': 'warn',
      '@angular-eslint/prefer-on-push-component-change-detection': 'warn',
    },
  },
  {
    files: ['**/*.html'],
    rules: {
      '@angular-eslint/template/click-events-have-key-events': 'warn',
      '@angular-eslint/template/interactive-supports-focus': 'warn',
      '@angular-eslint/template/label-has-associated-control': 'warn',
      '@angular-eslint/template/no-negated-async': 'warn',
    },
  },
] as const;
