import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';

export default defineConfig({
  root: './apps/search-widget-demo',
  plugins: [
    svelte({
      preprocess: sveltePreprocess(),
    }),
  ],
  publicDir: '../../libs/search-widget/public',
  server: {
    port: 3000,
  },
});
