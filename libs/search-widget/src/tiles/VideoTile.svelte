<script lang="ts">
  import { map, Observable, of, switchMap, tap } from 'rxjs';
  import type { Search } from '@nuclia/core';
  import { YoutubePlayer, VideoPlayer } from '../components';
  import { PreviewKind } from '../core/models';
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
      <YoutubePlayer
        time={mediaTime}
        uri={$mediaUrl}
        on:videoReady={onVideoReady} />
    {:else if !!$mediaContentType}
      <VideoPlayer
        time={mediaTime}
        src={$mediaUrl}
        type={$mediaContentType}
        on:videoReady={onVideoReady} />
    {/if}
  {/if}
</MediaTile>
