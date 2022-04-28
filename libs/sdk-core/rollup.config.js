import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import external from 'rollup-plugin-peer-deps-external';
import dts from 'rollup-plugin-dts';

const packageJson = require('./package.json');

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
      external({
        packageJsonPath: 'libs/sdk-core/package.json',
      }),
      resolve(),
      typescript({ tsconfig: './tsconfig.lib.json' }),
      terser({ format: { comments: false } }),
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
      external({
        packageJsonPath: 'libs/sdk-core/package.json',
      }),
      resolve(),
      typescript({ tsconfig: './tsconfig.lib.json' }),
      terser({ format: { comments: false } }),
    ],
  },
  {
    input: '../../dist/sdk-core/esm/src/index.d.ts',
    output: [{ file: '../../dist/sdk-core/types/index.d.ts', format: 'esm' }],
    external: [/\.css$/],
    plugins: [dts()],
  },
];
