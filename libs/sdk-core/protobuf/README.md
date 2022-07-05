# @nuclia/protobuf

JavaScript utility to handle Nuclia protobuffer messages.

`NucliaProtobufConverter` is a function accepting a buffer and returning a Promise that resolves to a parsed protobuffer message.

## Installation

```bash
npm install @nuclia/protobuf
```

or

```bash
yarn add @nuclia/protobuf
```

## Usage

When using a [webhook with the Nuclia Understanding API](https://docs.nuclia.dev/docs/understanding/intro#use-a-webhook), the posted message is directly a protobuffer message. It can be decoded using the NucliaProtobufConverter.

```js
import { NucliaProtobufConverter } from '@nuclia/protobuf';

router.post('/handle', (request, response) => {
  NucliaProtobufConverter(request.body).then((message) => {
    console.log(message);
  });
});
```

When calling the [Nuclia Understanding API `/pull` endpoint](https://docs.nuclia.dev/docs/api#operation/Get_processed_data_processing_pull_get), you get a JSOn message containing a `payload` entry with base64 encoded protobuffer message. Processing it could be done as follows:

```js
import { NucliaProtobufConverter } from '@nuclia/protobuf';
import fetch from 'node-fetch';

fetch('https://europe-1.stashify.cloud/api/v1/processing/pull', {
  headers: {
    'x-stf-nuakey': `Bearer ${NUA_KEY}`,
    'content-type': 'application/json',
  },
  method: 'GET',
})
  .then((res) => res.json())
  .then((data) => {
    if (data.status === 'ok' && data.payload) {
      return NucliaProtobufConverter(Buffer.from(data.payload, 'base64'));
    } else {
      return data;
    }
  })
  .then((res) => console.log(res));
```
