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
  backend: 'https://accounts.progress.cloud/api',
  zone: 'europe-1',
  knowledgeBox: '<YOUR-KB-ID>',
});
nuclia.knowledgeBox.search('where does the Little Prince live', [Search.Features.KEYWORD]).subscribe((searchResult) => {
  console.log('search result', searchResult);
});
```

### Backend URL Compatibility

- Preferred global backend: `https://accounts.<domain>/api`
- Preferred regional backend shape (derived by SDK): `https://<zone>.dp.<domain>/api`

For backward compatibility, the SDK also accepts legacy global backends like
`https://rag.<domain>/api` 

and normalizes them internally to

`https://accounts.<domain>/api` before building regional URLs.

This means both of these inputs are supported and produce the same final routing:

```ts
new Nuclia({ backend: 'https://accounts.progress.cloud/api', zone: 'europe-1', knowledgeBox: '<KB-ID>' });
new Nuclia({ backend: 'https://rag.progress.cloud/api', zone: 'europe-1', knowledgeBox: '<KB-ID>' });
```

In both cases, global requests use `accounts.<domain>` and regional requests use `<zone>.dp.<domain>`.

## Usage with NodeJS

This SDK can work in NodeJS by providing some polyfills for `localStorage` and `fetch`:

```js
const { Nuclia } = require('@nuclia/core');
require('localstorage-polyfill');
require('isomorphic-unfetch');

const nuclia = new Nuclia({
  backend: 'https://accounts.progress.cloud/api',
  zone: 'europe-1',
  knowledgeBox: '<YOUR-KB-ID>',
});
```

## Direct usage in the browser

The Nuclia SDK is also provided via a CDN for direct browser usage:

```html
<script src="https://cdn.rag.progress.cloud/nuclia-sdk.umd.js"></script>
```

It will expose a global variable `NucliaSDK` containing the `Nuclia` class:

```js
const nuclia = new NucliaSDK.Nuclia({
  backend: 'https://accounts.progress.cloud/api',
  zone: 'europe-1',
  knowledgeBox: '<YOUR-KB-ID>',
});
```
