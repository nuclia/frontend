import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
const sveltePreprocess = require('svelte-preprocess');

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [{ find: '@nuclia/core', replacement: path.resolve(__dirname, '../sdk-core/src/index.ts') }],
  },
  build: {
    outDir: 'dist/libs/search-video-widget',
    lib: {
      entry: 'libs/search-widget/src/_video-widget/lib.ts',
      name: 'NucliaWidgetLibrary',
      fileName: 'nuclia-video-widget',
    },
  },
  plugins: [
    svelte({
      include: ['libs/search-widget/src/**/*.svelte'],
      exclude: [
        'libs/search-widget/src/Widget.svelte',
        'libs/search-widget/src/_video-widget/SearchBar.svelte',
        'libs/search-widget/src/_video-widget/SearchResults.svelte',
      ],
      preprocess: sveltePreprocess(),
      compilerOptions: {
        css: true,
      },
    }),
    svelte({
      include: [
        'libs/search-widget/src/_video-widget/SearchBar.svelte',
        'libs/search-widget/src/_video-widget/SearchResults.svelte',
      ],
      preprocess: sveltePreprocess(),
      compilerOptions: {
        css: true,
        customElement: true,
      },
    }),
  ],
});
