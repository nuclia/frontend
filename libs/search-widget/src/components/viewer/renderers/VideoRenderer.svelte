<script lang="ts">
  import type { Observable } from 'rxjs';
  import { currentThumbnail, getFieldUrl, getFileUrls, getPlayableVideo, isLinkField, playFrom } from "../../../core";
  import { onDestroy } from 'svelte';
  import { map, of, switchMap, take, tap } from "rxjs";
  import YoutubePlayer from "./players/YoutubePlayer.svelte";
  import { Thumbnail } from "../../../common";
  import VideoPlayer from "./players/VideoPlayer.svelte";

  let mediaLoading = true;
  let mediaTime = 0;
  let isYoutube = false;
  let mediaContentType = '';
  const mediaUrl: Observable<string> = isLinkField().pipe(
    take(1),
    tap((isLink: boolean) => (isYoutube = isLink)),
    switchMap((isYoutube) =>
      isYoutube
        ? getFieldUrl()
        : getPlayableVideo().pipe(
          tap(file => mediaContentType = file?.content_type || ''),
          switchMap((video) => (video?.uri ? getFileUrls([video.uri]) : of(['']))),
          map((urls) => urls[0]),
        ),
    ),
  );

  const subscription = playFrom.subscribe((time: number) => mediaTime = time);

  onDestroy(() => {
    subscription.unsubscribe();
  });

  function onVideoReady() {
    mediaLoading = false;
  }
</script>

<div class="sw-video-renderer">
  <div class="thumbnail"
       class:visible={mediaLoading}>
    <Thumbnail src={$currentThumbnail}
               aspectRatio="16/9"></Thumbnail>
  </div>
  <div class="video-player"
       class:visible={!mediaLoading}>
    {#if $mediaUrl}
        {#if isYoutube}
          <YoutubePlayer time={mediaTime}
                         uri={$mediaUrl}
                         on:videoReady={onVideoReady}/>
        {:else}
          <VideoPlayer time={mediaTime}
                       src={$mediaUrl}
                       contentType={mediaContentType}
                       on:videoReady={onVideoReady}/>
        {/if}
    {/if}
  </div>
</div>

<style
  lang="scss"
  src="./VideoRenderer.scss"></style>
