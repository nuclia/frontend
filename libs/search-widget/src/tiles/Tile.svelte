<script lang="ts">
  import type { Search } from '@nuclia/core';
  import VideoTile from './video-tile/VideoTile.svelte';
  import PdfTile from './pdf-tile/PdfTile.svelte';
  import AudioTile from './audio-tile/AudioTile.svelte';
  import TextTile from './text-tile/TextTile.svelte';

  export let result: Search.SmartResult;
</script>

{#if result.icon === 'application/pdf'}
  <PdfTile {result} />
{:else if result.icon.includes('video')}
  <VideoTile {result} />
{:else if result.icon.includes('audio')}
  <AudioTile {result} />
{:else}
  <TextTile {result} />
{/if}
