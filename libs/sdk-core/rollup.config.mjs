import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import dts from 'rollup-plugin-dts';
import generatePackageJson from 'rollup-plugin-generate-package-json';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import packageJson from './package.json' with { type: 'json' };

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: `../../dist/sdk-core/${packageJson.module}`,
        format: 'esm',
      },
    ],
    plugins: [
      generatePackageJson({
        inputFolder: '.',
        outputFolder: '../../dist/sdk-core',
        baseContents: (pkg) => ({ ...pkg }),
      }),
      peerDepsExternal({
        packageJsonPath: 'libs/sdk-core/package.json',
      }),
      resolve(),
      typescript({ tsconfig: './tsconfig.lib.json' }),
      terser({ format: { comments: false } }),
      copy({
        targets: [
          { src: './README.md', dest: '../../dist/sdk-core' },
          { src: './CHANGELOG.md', dest: '../../dist/sdk-core' },
          { src: '../../LICENSE.md', dest: '../../dist/sdk-core' },
        ],
      }),
    ],
  },
  {
    input: 'src/index.ts',
    output: [
      {
        file: `../../dist/sdk-core/${packageJson.main}`,
        format: 'umd',
        name: 'NucliaSDK',
      },
    ],
    plugins: [
      peerDepsExternal({
        packageJsonPath: 'libs/sdk-core/package.json',
      }),
      resolve(),
      typescript({ tsconfig: './tsconfig.lib.umd.json' }),
      terser({ format: { comments: false } }),
    ],
  },
  {
    input: '../../dist/sdk-core/esm/types/libs/sdk-core/src/index.d.ts',
    output: [{ file: '../../dist/sdk-core/types/index.d.ts', format: 'esm' }],
    external: [/\.css$/],
    plugins: [dts()],
  },
];
