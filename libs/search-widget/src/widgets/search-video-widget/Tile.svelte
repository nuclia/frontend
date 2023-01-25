<script lang="ts">
  import { Search } from '@nuclia/core';
  import VideoTile from '../../tiles/video-tile/VideoTile.svelte';
  import PdfTile from '../../tiles/pdf-tile/PdfTile.svelte';
  import AudioTile from '../../tiles/audio-tile/AudioTile.svelte';
  import TextTile from '../../tiles/text-tile/TextTile.svelte';

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
