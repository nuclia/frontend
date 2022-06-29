# Nuclia JavaScript SDK

Nuclia SDK is an open-source library wrapping Nuclia API in order to integrate [Nuclia](https://nuclia.com) services in your frontend application.

The full documentation is available at [https://docs.nuclia.dev/docs/sdk/sdk_api](https://docs.nuclia.dev/docs/sdk/sdk_api).

Basic usage:

```ts
import { Nuclia } from '@nuclia/core';

const nuclia = new Nuclia({
  backend: 'https://stashify.cloud/api',
  zone: 'europe-1',
  knowledgeBox: '<YOUR-KB-ID>',
});
nuclia.knowledgeBox
  .search('where does the Little Prince live', [Search.Features.PARAGRAPH])
  .subscribe((searchResult) => {
    console.log('search result', searchResult);
  });
```
