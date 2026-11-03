import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      reporter: ['html'],
      reportsDirectory: resolve(import.meta.dirname, '../../coverage/apps/rao'),
    },
  },
});
