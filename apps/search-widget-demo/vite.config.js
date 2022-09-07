import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

const HMRCustomElementsStyle = (paths) => ({
  name: 'hmr-scss',
  handleHotUpdate({ file, server, timestamp }) {
    if (file.endsWith('.scss')) {
      server.ws.send({
        type: 'update',
        updates: paths.map((componentPath) => {
          const absolutePath = path.resolve(__dirname, componentPath);
          return {
            acceptedPath: `/@fs${absolutePath}`,
            path: `/@fs${absolutePath}`,
            timestamp,
            type: 'js-update',
          };
        }),
      });
    }
  },
});

export default defineConfig({
  root: './apps/search-widget-demo',
  plugins: [
    svelte(),
    // svelte({
    //   include: ['./libs/search-widget/**/*.svelte', './apps/search-widget-demo/src/App.svelte'],
    //   exclude: [
    //     './libs/search-widget/src/Widget.svelte',
    //     './libs/search-widget/src/_video-widget/SearchBar.svelte',
    //     './libs/search-widget/src/_video-widget/SearchResults.svelte',
    //   ],
    //   compilerOptions: {
    //     customElement: false,
    //   },
    // }),
    // svelte({
    //   include: [
    //     './libs/search-widget/src/Widget.svelte',
    //     './libs/search-widget/src/_video-widget/SearchBar.svelte',
    //     './libs/search-widget/src/_video-widget/SearchResults.svelte',
    //   ],
    //   compilerOptions: {
    //     customElement: true,
    //   },
    // }),
    // HMRCustomElementsStyle([
    //   '../../libs/search-widget/src/Widget.svelte',
    //   '../../libs/search-widget/src/_video-widget/SearchBar.svelte',
    //   '../../libs/search-widget/src/_video-widget/SearchResults.svelte',
    // ]),
  ],
  publicDir: '../../libs/search-widget/public',
});
