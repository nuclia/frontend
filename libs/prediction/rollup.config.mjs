import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import generatePackageJson from 'rollup-plugin-generate-package-json';
import dts from 'rollup-plugin-dts';
import copy from 'rollup-plugin-copy';
import packageJson from './package.json' assert {type: 'json'};

const production = !process.env.ROLLUP_WATCH;

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        sourcemap: !production,
        file: `../../dist/prediction/${packageJson.module}`,
        format: 'esm',
      },
    ],
    plugins: [
      generatePackageJson({
        inputFolder: '.',
        outputFolder: '../../dist/prediction',
        baseContents: (pkg) => ({ ...pkg }),
      }),
      peerDepsExternal({
        packageJsonPath: 'libs/prediction/package.json',
      }),
      resolve(),
      typescript({ tsconfig: './tsconfig.lib.json' }),
      terser({ format: { comments: false } }),
      copy({
        targets: [
          { src: './README.md', dest: '../../dist/prediction' },
          { src: './CHANGELOG.md', dest: '../../dist/prediction' },
          { src: '../../LICENSE.md', dest: '../../dist/prediction' },
        ],
      }),
    ],
  },
  {
    input: 'src/index.ts',
    output: [
      {
        file: `../../dist/prediction/${packageJson.main}`,
        format: 'umd',
        name: 'NucliaPredictionSDK',
      },
    ],
    plugins: [
      peerDepsExternal({
        packageJsonPath: 'libs/prediction/package.json',
      }),
      resolve(),
      typescript({ tsconfig: './tsconfig.lib.json' }),
      terser({ format: { comments: false } }),
    ],
  },
  {
    input: '../../dist/prediction/esm/src/index.d.ts',
    output: [{ file: '../../dist/prediction/types/index.d.ts', format: 'esm' }],
    external: [/\.css$/],
    plugins: [dts()],
  },
];
