import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

const sdkCoreEntry = path.resolve(__dirname, '../sdk-core/src/index.ts');

export default defineConfig({
  define: {
    'process.env': {
      NODE_ENV: 'production',
    },
  },
  resolve: {
    alias: [{ find: '@nuclia/core', replacement: sdkCoreEntry }],
  },
  plugins: [react()],

  // 👇 Insert these lines
  build: {
    outDir: './dist/rao-widget',
    lib: {
      entry: 'libs/rao-widget/src/index.ts',
      name: 'rao-widget',
      fileName: (format) => `rao-widget.${format}.js`,
      formats: ['umd'],
    },
    target: 'esnext',
  },
});
