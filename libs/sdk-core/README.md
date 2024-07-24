# Nuclia JavaScript SDK

Nuclia SDK is an open-source library wrapping Nuclia API in order to integrate [Nuclia](https://nuclia.com) services in your frontend application.

It supports both JavaScript and TypeScript.

The full documentation is available at [https://docs.nuclia.dev/docs/develop/js-sdk/](https://docs.nuclia.dev/docs/develop/js-sdk/).

## Basic usage

```ts
import { Nuclia } from '@nuclia/core';

const nuclia = new Nuclia({
  backend: 'https://nuclia.cloud/api',
  zone: 'europe-1',
  knowledgeBox: '<YOUR-KB-ID>',
});
nuclia.knowledgeBox
  .search('where does the Little Prince live', [Search.Features.KEYWORD])
  .subscribe((searchResult) => {
    console.log('search result', searchResult);
  });
```

## Usage with NodeJS

This SDK can work in NodeJS by providing some polyfills for `localStorage` and `fetch`:

```js
const { Nuclia } = require('@nuclia/core');
require('localstorage-polyfill');
require('isomorphic-unfetch');

const nuclia = new Nuclia({
  backend: 'https://nuclia.cloud/api',
  zone: 'europe-1',
  knowledgeBox: '<YOUR-KB-ID>',
});
```
