import { defineConfig } from 'vitest/config';

// Only plain Vitest projects are listed. Angular projects run through `@angular/build:unit-test` (`nx test <project>`)
// and must not be added here, as they cannot run with a direct `vitest` call.
export default defineConfig({
  test: {
    projects: [
      'libs/sdk-core/vitest.config.mts',
      'libs/search-widget/vite.config.mjs',
      'apps/search-widget-demo/vite.config.ts',
      'libs/chrome-ext/vitest.config.mts',
    ],
  },
});
