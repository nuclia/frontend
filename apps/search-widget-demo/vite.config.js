import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  root: './apps/search-widget-demo',
  plugins: [svelte()],
  publicDir: '../../libs/search-widget/public',
});
