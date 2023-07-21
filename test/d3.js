/**
 * After upgrading to d3 version 7+, the unit tests stopped running because of the new ES6 modules used in d3.
 * Solution to solve this problem found in: https://stackoverflow.com/questions/69163409/how-to-use-d3-js-v7-with-jest-and-babel-loader
 * Basically, we use moduleNameMapper in jest.preset.js to tell Jest use this file for d3 imports.
 * We currently don't need any mock for our tests to run, so this file is empty for now.
 */
