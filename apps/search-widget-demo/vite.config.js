import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const sveltePreprocess = require('svelte-preprocess');

export default defineConfig({
  root: './apps/search-widget-demo',
  plugins: [
    svelte({
      preprocess: sveltePreprocess(),
    }),
  ],
  publicDir: '../../libs/search-widget/public',
});
