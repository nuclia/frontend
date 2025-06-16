import { svelte } from '@sveltejs/vite-plugin-svelte';
import * as path from 'path';
import { sveltePreprocess } from 'svelte-preprocess';
import { defineConfig } from 'vite';

const widgetFolder = process.argv[5] || 'search-widget';
const fileName = process.argv[6] || 'nuclia-widget';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    conditions: process.env.VITEST ? ['browser'] : undefined,
    alias: [{ find: '@nuclia/core', replacement: path.resolve(__dirname, '../sdk-core/src/index.ts') }],
  },
  build: {
    outDir: `dist/libs/${widgetFolder}`,
    lib: {
      entry: `libs/search-widget/src/widgets/${widgetFolder}/lib.ts`,
      name: 'NucliaWidgetLibrary',
      fileName,
    },
  },
  plugins: [
    svelte({
      preprocess: sveltePreprocess(),
      compilerOptions: {
        customElement: true,
      },
    }),
  ],
  test: {
    // Jest like globals
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
