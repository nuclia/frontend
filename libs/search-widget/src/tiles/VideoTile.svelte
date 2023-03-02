<script lang="ts">
  import { filter, Observable, tap } from 'rxjs';
  import type { Search } from '@nuclia/core';
  import { switchMap, take } from 'rxjs/operators';
  import Youtube from '../components/previewers/Youtube.svelte';
  import { PreviewKind } from '../core/models';
  import Player from '../components/previewers/Player.svelte';
  import { fieldData, getFieldUrl, getFileFieldContentType, isLinkField } from '../core/stores/viewer.store';
  import MediaTile from './base-tile/MediaTile.svelte';

  export let result: Search.SmartResult = { id: '' } as Search.SmartResult;

  let mediaLoading = true;
  let mediaTime = 0;
  let mediaContentType: string | undefined;

  let mediaUrl: Observable<string>;
  let summary: Observable<string>;
  let isYoutube = false;

  const playFrom = (time: number) => {
    mediaTime = time;
    if (!mediaUrl && result.field) {
      mediaUrl = getFieldUrl();

      fieldData
        .pipe(
          filter((data) => !!data),
          take(1),
          switchMap(() => isLinkField()),
          tap((isLink: boolean) => (isYoutube = isLink)),
          switchMap(() => getFileFieldContentType()),
        )
        .subscribe((contentType) => {
          mediaContentType = contentType;
        });
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
    {:else if !!mediaContentType}
      <Player
        time={mediaTime}
        src={$mediaUrl}
        type={mediaContentType}
        on:videoReady={onVideoReady} />
    {/if}
  {/if}
</MediaTile>
