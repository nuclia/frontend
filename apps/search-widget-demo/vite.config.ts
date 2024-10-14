import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@nuclia/core': path.resolve(__dirname, '../../libs/sdk-core/src/index.ts'),
    },
  },
  plugins: [
    svelte({
      preprocess: sveltePreprocess(),
    }),
  ],
  publicDir: '../../libs/search-widget/public',
});
