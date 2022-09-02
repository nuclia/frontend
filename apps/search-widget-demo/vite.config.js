import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte({
      include: ['../../libs/search-widget/**/*.svelte', './src/App.svelte'],
      exclude: ['../../libs/search-widget/src/Widget.svelte'],
      preprocess: sveltePreprocess(),
      compilerOptions: {
        customElement: false,
      },
    }),
    svelte({
      include: ['../../libs/search-widget/src/Widget.svelte'],
      preprocess: sveltePreprocess(),
      compilerOptions: {
        customElement: true,
      },
    }),
  ],
  publicDir: '../../libs/search-widget/public',
});
