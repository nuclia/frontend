<script lang="ts">
  import type { Search } from '@nuclia/core';
  import { PreviewKind } from '../core/models';
  import { getCDN } from '../core/utils';
  import type { Observable } from 'rxjs';
  import AudioPlayer from '../components/viewer/renderers/players/AudioPlayer.svelte';
  import { getFieldUrl } from '../core/stores/viewer.store';
  import MediaTile from './base-tile/MediaTile.svelte';

  export let result: Search.FieldResult;

  let mediaLoading = true;
  let mediaTime = 0;

  let mediaUrl: Observable<string>;
  let summary: Observable<string>;

  const playFrom = (time: number) => {
    mediaTime = time;

    if (!mediaUrl && result.field) {
      mediaUrl = getFieldUrl();
    }
  };
</script>

<MediaTile
  previewKind={PreviewKind.AUDIO}
  {result}
  {mediaLoading}
  fallbackThumbnail={`${getCDN()}tiles/audio.svg`}
  on:playFrom={(event) => playFrom(event.detail)}>
  {#if $mediaUrl}
    <AudioPlayer
      time={mediaTime}
      src={$mediaUrl}
      on:audioReady={() => (mediaLoading = false)}
      on:error={() => (mediaLoading = false)} />
  {/if}
</MediaTile>
