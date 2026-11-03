import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  resolve: { tsconfigPaths: true },
  test: {
    name: 'sdk-core',
    globals: true,
    environment: 'jsdom',
    reporters: ['default'],
    include: ['src/**/*.{spec,test}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['html'],
      reportsDirectory: resolve(import.meta.dirname, '../../coverage/libs/sdk-core'),
    },
  },
});
