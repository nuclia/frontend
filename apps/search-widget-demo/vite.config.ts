import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import path from 'path';

const sdkCoreEntry = path.resolve(__dirname, '../../libs/sdk-core/src/index.ts');
const raoWidgetSrc = path.resolve(__dirname, '../../libs/rao-widget/src');

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      { find: '@nuclia/core', replacement: sdkCoreEntry },
      { find: 'rao-widget', replacement: raoWidgetSrc },
      { find: /^rao-widget\/(.*)/, replacement: `${raoWidgetSrc}/$1` },
    ],
  },
  plugins: [
    svelte({
      preprocess: sveltePreprocess(),
      compilerOptions: {
        customElement: true,
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['rao-widget'],
  },
  publicDir: '../../libs/search-widget/public',
});
