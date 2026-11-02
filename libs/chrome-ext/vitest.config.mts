import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  test: {
    name: 'chrome-ext',
    globals: true,
    passWithNoTests: true,
    include: ['src/**/*.{spec,test}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['html'],
      reportsDirectory: resolve(import.meta.dirname, '../../coverage/libs/chrome-ext'),
    },
  },
});
