<script lang="ts">
  import type { FileFieldData, LinkFieldData, Search } from '@nuclia/core';
  import { FIELD_TYPE } from '@nuclia/core';
  import VideoTile from './VideoTile.svelte';
  import PdfTile from './PdfTile.svelte';
  import AudioTile from './AudioTile.svelte';
  import ImageTile from './ImageTile.svelte';
  import SpreadsheetTile from './SpreadsheetTile.svelte';
  import ConversationTile from './ConversationTile.svelte';
  import TextTile from './TextTile.svelte';

  export let result: Search.FieldResult;
  export let id: '';

  const SpreadsheetContentTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.oasis.opendocument.spreadsheet',
  ];

  let tileType: 'pdf' | 'video' | 'audio' | 'image' | 'spreadsheet' | 'conversation' | 'text';
  $: {
    if (result?.field?.field_type === FIELD_TYPE.link && !!result?.fieldData?.value) {
      const url = (result.fieldData as LinkFieldData).value?.uri;
      tileType = url?.includes('youtube.com') || url?.includes('youtu.be') ? 'video' : 'text';
    } else if (result?.field?.field_type === FIELD_TYPE.conversation) {
      tileType = 'conversation';
    } else if (result?.field?.field_type === FIELD_TYPE.file && !!result?.fieldData?.value) {
      const file = (result.fieldData as FileFieldData).value?.file;
      // for audio, video, image or text, we have a corresponding tile
      // for mimetype starting with 'application/', it is more complex:
      // - anything like a spreadsheet is a spreadsheet
      // - 'application/octet-stream' is the default generic mimetype, its means we have no idea what it is, so we use text as that's the most reliable
      // - anything else is a pdf ('application/pdf' of course, but also any MSWord, OpenOffice, etc., are converted to pdf by the backend)
      if (file?.content_type?.startsWith('audio')) {
        tileType = 'audio';
      } else if (file?.content_type?.startsWith('video')) {
        tileType = 'video';
      } else if (file?.content_type?.startsWith('image')) {
        tileType = 'image';
      } else if (file?.content_type?.startsWith('text')) {
        tileType = 'text';
      } else if (SpreadsheetContentTypes.includes(file?.content_type || '')) {
        tileType = 'spreadsheet';
      } else if (file?.content_type?.startsWith('application/octet-stream')) {
        tileType = 'text';
      } else if (file?.content_type?.startsWith('application')) {
        tileType = 'pdf';
      } else {
        tileType = 'text';
      }
    } else {
      tileType = 'text';
    }
  }
</script>

{#if id}
  <small>{id}</small>
{/if}

{#if tileType}
  {#if tileType === 'pdf'}
    <PdfTile {result} {id}/>
  {:else if tileType === 'video'}
    <VideoTile {result} {id}/>
  {:else if tileType === 'audio'}
    <AudioTile {result} {id}/>
  {:else if tileType === 'image'}
    <ImageTile {result} {id}/>
  {:else if tileType === 'spreadsheet'}
    <SpreadsheetTile {result} {id}/>
  {:else if tileType === 'conversation'}
    <ConversationTile {result} {id}/>
  {:else}
    <TextTile {result} {id}/>
  {/if}
{/if}
