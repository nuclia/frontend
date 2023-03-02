<script lang="ts">
  import type { Search } from '@nuclia/core';
  import VideoTile from './VideoTile.svelte';
  import PdfTile from './PdfTile.svelte';
  import AudioTile from './AudioTile.svelte';
  import ImageTile from './ImageTile.svelte';
  import SpreadsheetTile from './SpreadsheetTile.svelte';
  import TextTile from './TextTile.svelte';
  import type { FileFieldData, LinkFieldData } from '@nuclia/core';
  import { FIELD_TYPE } from '@nuclia/core';

  export let result: Search.SmartResult;

  const SpreadsheetContentTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.oasis.opendocument.spreadsheet',
  ];

  let tileType: 'pdf' | 'video' | 'audio' | 'image' | 'spreadsheet' | 'text';
  $: {
    if (result?.field?.field_type === FIELD_TYPE.link && !!result?.fieldData?.value) {
      const url = (result.fieldData as LinkFieldData).value?.uri;
      tileType = url?.includes('youtube.com') || url?.includes('youtu.be') ? 'video' : 'text';
    } else if (result?.field?.field_type === FIELD_TYPE.file && !!result?.fieldData?.value) {
      const file = (result.fieldData as FileFieldData).value?.file;
      if (file?.content_type?.includes('audio')) {
        tileType = 'audio';
      } else if (file?.content_type?.includes('video')) {
        tileType = 'video';
      } else if (file?.content_type?.includes('image')) {
        tileType = 'image';
      } else if (file?.content_type?.startsWith('text/plain')) {
        tileType = 'text';
      } else if (SpreadsheetContentTypes.includes(file?.content_type || '')) {
        tileType = 'spreadsheet';
      } else {
        tileType = 'pdf';
      }
    } else {
      tileType = 'text';
    }
  }
</script>

{#if tileType}
  {#if tileType === 'pdf'}
    <PdfTile {result} />
  {:else if tileType === 'video'}
    <VideoTile {result} />
  {:else if tileType === 'audio'}
    <AudioTile {result} />
  {:else if tileType === 'image'}
    <ImageTile {result} />
  {:else if tileType === 'spreadsheet'}
    <SpreadsheetTile {result} />
  {:else}
    <TextTile {result} />
  {/if}
{/if}
