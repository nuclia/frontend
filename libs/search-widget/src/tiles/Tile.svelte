<script lang="ts">
  import type { Search } from '@nuclia/core';
  import VideoTile from './video-tile/VideoTile.svelte';
  import PdfTile from './pdf-tile/PdfTile.svelte';
  import AudioTile from './audio-tile/AudioTile.svelte';
  import TextTile from './text-tile/TextTile.svelte';
  import { FIELD_TYPE, FileFieldData, LinkFieldData } from '@nuclia/core';

  export let result: Search.SmartResult;

  let tileType: 'pdf' | 'video' | 'audio' | 'text' = 'text';
  $: if (result?.field?.field_type === FIELD_TYPE.link && !!result?.fieldData?.value) {
    const url = (result.fieldData as LinkFieldData).value.uri;
    tileType = url.includes('youtube.com') || url.includes('youtu.be') ? 'video' : 'text';
  } else if (result?.field?.field_type === FIELD_TYPE.file && !!result?.fieldData?.value) {
    const file = (result.fieldData as FileFieldData).value.file;
    if (file.content_type?.includes('audio')) {
      tileType = 'audio';
    } else if (file.content_type?.includes('video')) {
      tileType = 'video';
    } else if (file.content_type?.includes('pdf')) {
      tileType = 'pdf';
    }
  }
</script>

{#if tileType === 'pdf'}
  <PdfTile {result} />
{:else if tileType === 'video'}
  <VideoTile {result} />
{:else if tileType === 'audio'}
  <AudioTile {result} />
{:else}
  <TextTile {result} />
{/if}
