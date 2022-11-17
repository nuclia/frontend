import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import * as path from 'path';
const sveltePreprocess = require('svelte-preprocess');

export default defineConfig({
  resolve: {
    alias: [
      { find: '@nuclia/core', replacement: path.resolve(__dirname, '../sdk-core/src/index.ts') },
      { find: '@nuclia/prediction', replacement: path.resolve(__dirname, '../prediction/src/index.ts') },
    ],
  },
  build: {
    outDir: `dist/libs/search-widget-no-shadow`,
    lib: {
      entry: `libs/search-widget/src/widgets/search-widget/lib.no-shadow.ts`,
      name: 'NucliaWidgetLibrary',
      fileName: 'nuclia-widget-no-shadow',
      formats: ['umd'],
    },
  },
  plugins: [
    svelte({
      include: ['libs/search-widget/src/**/*.svelte'],
      preprocess: sveltePreprocess(),
      compilerOptions: {
        css: true,
      },
    }),
  ],
});
