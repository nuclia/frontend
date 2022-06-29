import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import inject from '@rollup/plugin-inject';
import generatePackageJson from 'rollup-plugin-generate-package-json';
import dts from 'rollup-plugin-dts';
import copy from 'rollup-plugin-copy';

const packageJson = require('./package.json');

export default [
  {
    input: '../src/index.ts',
    output: [
      {
        file: `../../../dist/sdk-core-node/${packageJson.main}`,
        format: 'esm',
      },
    ],
    plugins: [
      generatePackageJson({
        inputFolder: '.',
        outputFolder: '../../../dist/sdk-core-node',
        baseContents: (pkg) => ({ ...pkg }),
      }),
      inject({
        localStorage: 'localstorage-polyfill',
        fetch: 'node-fetch',
      }),
      resolve(),
      typescript({ tsconfig: '../tsconfig.lib.json' }),
      terser({ format: { comments: false } }),
      copy({
        targets: [
          { src: './README.md', dest: '../../../dist/sdk-core-node' },
          { src: '../../../LICENSE.md', dest: '../../../dist/sdk-core-node' },
        ],
      }),
    ],
  },
  {
    input: '../../../dist/sdk-core-node/dist/src/index.d.ts',
    output: [{ file: '../../../dist/sdk-core-node/types/index.d.ts', format: 'esm' }],
    external: [/\.css$/],
    plugins: [dts()],
  },
];
