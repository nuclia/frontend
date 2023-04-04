module.exports = {
  displayName: 'search-widget-demo',
  preset: '../../jest.preset.js',
  globals: {},
  transform: {
    '^(.+\\.svelte$)': [
      'svelte-jester',
      {
        preprocess: 'apps/search-widget-demo/jest.config.js/svelte.config.js',
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
  coverageDirectory: '../../coverage/apps/search-widget-demo',
};
