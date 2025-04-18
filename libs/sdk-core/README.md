# Nuclia JavaScript SDK

Nuclia SDK is an open-source library wrapping Nuclia API in order to integrate [Nuclia](https://nuclia.com) services in your frontend application.

It supports both JavaScript and TypeScript.

It can be installed via npm:

```bash
npm install @nuclia/core
```

The full documentation is available at [https://docs.nuclia.dev/docs/develop/js-sdk/](https://docs.nuclia.dev/docs/develop/js-sdk/).

## Basic usage

```ts
import { Nuclia } from '@nuclia/core';

const nuclia = new Nuclia({
  backend: 'https://nuclia.cloud/api',
  zone: 'europe-1',
  knowledgeBox: '<YOUR-KB-ID>',
});
nuclia.knowledgeBox.search('where does the Little Prince live', [Search.Features.KEYWORD]).subscribe((searchResult) => {
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

## Direct usage in the browser

The Nuclia SDK is also provided via a CDN for direct browser usage:

```html
<script src="https://cdn.stashify.cloud/nuclia-sdk.umd.js"></script>
```

It will expose a global variable `NucliaSDK` containing the `Nuclia` class:

```js
const nuclia = new NucliaSDK.Nuclia({
  backend: 'https://nuclia.cloud/api',
  zone: 'europe-1',
  knowledgeBox: '<YOUR-KB-ID>',
});
```
