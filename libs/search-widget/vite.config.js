import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
const sveltePreprocess = require('svelte-preprocess');

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: 'dist/libs/search-widget',
    lib: {
      entry: 'libs/search-widget/src/lib.ts',
      name: 'NucliaWidgetLibrary',
      fileName: 'nuclia-widget',
    },
  },
  plugins: [
    svelte({
      include: ['libs/search-widget/src/**/*.svelte'],
      exclude: [
        'libs/search-widget/src/Widget.svelte',
        'libs/search-widget/src/SearchBar.svelte',
        'libs/search-widget/src/SearchResults.svelte',
      ],
      preprocess: sveltePreprocess(),
      compilerOptions: {
        css: true,
      },
    }),
    svelte({
      include: [
        'libs/search-widget/src/Widget.svelte',
        'libs/search-widget/src/SearchBar.svelte',
        'libs/search-widget/src/SearchResults.svelte',
      ],
      preprocess: sveltePreprocess(),
      compilerOptions: {
        css: true,
        customElement: true,
      },
    }),
  ],
});
