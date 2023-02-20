<script lang="ts">
  import { Search } from '@nuclia/core';
  import { PreviewKind } from '../../core/models';
  import { getCDN } from '../../core/utils';
  import { Observable } from 'rxjs';
  import { AudioPlayer } from '../../common/player';
  import { getFieldUrl } from '../../core/stores/viewer.store';
  import MediaTile from '../base-tile/MediaTile.svelte';

  export let result: Search.SmartResult;

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
