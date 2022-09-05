import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  root: './apps/search-widget-demo',
  plugins: [
    svelte({
      include: ['./libs/search-widget/**/*.svelte', './apps/search-widget-demo/src/App.svelte'],
      exclude: ['./libs/search-widget/src/Widget.svelte'],
      compilerOptions: {
        customElement: false,
      },
    }),
    svelte({
      include: ['./libs/search-widget/src/Widget.svelte'],
      compilerOptions: {
        customElement: true,
      },
    }),
    {
      name: 'hmr-scss',
      handleHotUpdate({ file, server, timestamp }) {
        if (file.endsWith('.scss')) {
          const mainComponentPath = path.resolve(__dirname, '../../libs/search-widget/src/Widget.svelte');
          server.ws.send({
            type: 'update',
            updates: [
              {
                acceptedPath: `/@fs${mainComponentPath}`,
                path: `/@fs${mainComponentPath}`,
                timestamp,
                type: 'js-update',
              },
            ],
          });
        }
      },
    },
  ],
  publicDir: '../../libs/search-widget/public',
});
