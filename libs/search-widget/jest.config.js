module.exports = {
  displayName: 'search-widget',
  preset: '../../jest.preset.js',
  globals: {},
  testEnvironment: 'jsdom',
  transform: {
    '^(.+\\.svelte$)': [
      'svelte-jester',
      {
        preprocess: 'libs/search-widget/svelte.config.cjs',
      },
    ],
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['svelte', 'ts', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/search-widget',
};
