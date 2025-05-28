<script lang="ts">
  import type { Observable } from 'rxjs';
  import { map, of, switchMap, take, tap } from 'rxjs';
  import { onDestroy } from 'svelte';
  import { currentThumbnail, getFieldUrl, getFileUrls, getPlayableVideo, isLinkField, playFrom } from '../../../core';
  import { Thumbnail } from '../../../common';
  import { VideoPlayer, YoutubePlayer } from './players';

  let mediaLoading = $state(true);
  let mediaTime = $state(0);
  let isYoutube = $state(false);
  let mediaContentType = $state('');
  const mediaUrl: Observable<string> = isLinkField().pipe(
    take(1),
    tap((isLink: boolean) => (isYoutube = isLink)),
    switchMap((isYoutube) =>
      isYoutube
        ? getFieldUrl()
        : getPlayableVideo().pipe(
            tap((file) => (mediaContentType = file?.content_type || '')),
            switchMap((video) => (video?.uri ? getFileUrls([video.uri]) : of(['']))),
            map((urls) => urls[0]),
          ),
    ),
  );

  const subscription = playFrom.subscribe((time: number) => (mediaTime = time));

  onDestroy(() => {
    subscription.unsubscribe();
  });

  function onVideoReady() {
    mediaLoading = false;
  }
</script>

<div class="sw-video-renderer">
  <div
    class="thumbnail"
    class:visible={mediaLoading}>
    <Thumbnail
      src={$currentThumbnail}
      aspectRatio="16/9"></Thumbnail>
  </div>
  <div
    class="video-player"
    class:visible={!mediaLoading}>
    {#if $mediaUrl}
      {#if isYoutube}
        <YoutubePlayer
          time={mediaTime}
          uri={$mediaUrl}
          on:videoReady={onVideoReady} />
      {:else}
        <VideoPlayer
          time={mediaTime}
          src={$mediaUrl}
          contentType={mediaContentType}
          on:videoReady={onVideoReady} />
      {/if}
    {/if}
  </div>
</div>

<style
  lang="scss"
  src="./VideoRenderer.scss"></style>
