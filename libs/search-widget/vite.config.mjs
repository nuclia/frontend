import { svelte } from '@sveltejs/vite-plugin-svelte';
import * as path from 'path';
import { sveltePreprocess } from 'svelte-preprocess';
import { defineConfig } from 'vite';

const markerIndex = process.argv.indexOf('--');
let widgetFolder = 'search-widget';
let fileName = 'nuclia-widget';

if (markerIndex !== -1) {
  widgetFolder = process.argv[markerIndex + 1] || widgetFolder;
  fileName = process.argv[markerIndex + 2] || fileName;
} else {
  widgetFolder = process.argv[5] || widgetFolder;
  fileName = process.argv[6] || fileName;
}

const sdkCoreEntry = path.resolve(__dirname, '../sdk-core/src/index.ts');
const raoWidgetSrc = path.resolve(__dirname, '../rao-widget/src');

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
  resolve: {
    conditions: process.env.VITEST ? ['browser'] : undefined,
    alias: [
      { find: '@nuclia/core', replacement: sdkCoreEntry },
      { find: 'rao-widget', replacement: raoWidgetSrc },
      { find: /^rao-widget\/(.*)/, replacement: `${raoWidgetSrc}/$1` },
    ],
  },
  build: {
    outDir: `dist/libs/${widgetFolder}`,
    lib: {
      entry: `libs/search-widget/src/widgets/${widgetFolder}/lib.ts`,
      name: 'NucliaWidgetLibrary',
      fileName,
    },
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
  test: {
    // Jest like globals
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
