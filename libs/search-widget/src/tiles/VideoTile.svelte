<script lang="ts">
  import { map, Observable, of, switchMap, tap } from 'rxjs';
  import type { Search } from '@nuclia/core';
  import Youtube from '../components/previewers/Youtube.svelte';
  import { PreviewKind } from '../core/models';
  import Player from '../components/previewers/Player.svelte';
  import { getFieldUrl, getPlayableVideo, isLinkField } from '../core/stores/viewer.store';
  import { getFileUrls } from '../core/api';
  import MediaTile from './base-tile/MediaTile.svelte';

  export let result: Search.FieldResult;

  let mediaLoading = true;
  let mediaTime = 0;

  let mediaUrl: Observable<string>;
  let mediaContentType: Observable<string>;
  let summary: Observable<string>;
  let isYoutube = false;

  const playFrom = (time: number) => {
    mediaTime = time;
    if (!mediaUrl && result.field) {
      mediaUrl = isLinkField().pipe(
        tap((isLink: boolean) => (isYoutube = isLink)),
        switchMap((isYoutube) =>
          isYoutube
            ? getFieldUrl()
            : getPlayableVideo().pipe(
                switchMap((video) => (video?.uri ? getFileUrls([video.uri]) : of(['']))),
                map((urls) => urls[0]),
              ),
        ),
      );
      mediaContentType = getPlayableVideo().pipe(map((file) => file?.content_type || ''));
    }
  };

  const onVideoReady = () => {
    mediaLoading = false;
  };
</script>

<MediaTile
  previewKind={PreviewKind.VIDEO}
  {result}
  {mediaLoading}
  on:playFrom={(event) => playFrom(event.detail)}>
  {#if $mediaUrl}
    {#if isYoutube}
      <Youtube
        time={mediaTime}
        uri={$mediaUrl}
        on:videoReady={onVideoReady} />
    {:else if !!$mediaContentType}
      <Player
        time={mediaTime}
        src={$mediaUrl}
        type={$mediaContentType}
        on:videoReady={onVideoReady} />
    {/if}
  {/if}
</MediaTile>
