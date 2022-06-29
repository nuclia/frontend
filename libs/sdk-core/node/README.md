# Nuclia JavaScript SDK

The Nuclia SDK is an open-source library wrapping the Nuclia API in order to integrate the [Nuclia](https://nuclia.com) services in your Node application.

The full documentation is available at [https://docs.nuclia.dev/docs/sdk/sdk_api](https://docs.nuclia.dev/docs/sdk/sdk_api).

Basic usage:

```ts
import { Nuclia } from '@nuclia/core-node';

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
