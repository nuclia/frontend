import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import * as path from 'path';
const sveltePreprocess = require('svelte-preprocess');

const widgetFolder = process.argv[5] || 'search-widget';
const fileName = process.argv[6] || 'nuclia-widget';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      { find: '@nuclia/core', replacement: path.resolve(__dirname, '../sdk-core/src/index.ts') },
      { find: '@nuclia/prediction', replacement: path.resolve(__dirname, '../prediction/src/index.ts') },
    ],
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
      include: ['libs/search-widget/src/**/*.svelte'],
      exclude: ['libs/search-widget/src/widgets/**/*.svelte'],
      preprocess: sveltePreprocess(),
      compilerOptions: {
        css: true,
      },
    }),
    svelte({
      include: [`libs/search-widget/src/widgets/${widgetFolder}/*.svelte`],
      preprocess: sveltePreprocess(),
      compilerOptions: {
        css: true,
        customElement: true,
      },
    }),
  ],
});
