import { nxReadySignal } from '@nx/vite/plugins/nx-ready-signal.plugin';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';
import sveltePreprocess from 'svelte-preprocess';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@nuclia/core': path.resolve(import.meta.dirname, '../../libs/sdk-core/src/index.ts'),
    },
  },
  plugins: [
    svelte({
      preprocess: sveltePreprocess(),
    }),
    nxReadySignal(),
  ],
  publicDir: '../../libs/search-widget/public',
});
