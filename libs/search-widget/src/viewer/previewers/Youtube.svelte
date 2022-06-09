<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { getYoutubeId } from '../../core/utils';

  export let uri: string;
  export let time: number;
  let player: any;
  let apiReady = false;
  let videoReady = false;

  $: if (videoReady && typeof time === 'number') {
    player?.seekTo(time);
    player?.playVideo();
  }

  if (!(window as any).onYouTubeIframeAPIReady) {
    (window as any).onYouTubeIframeAPIReady = () => {
      apiReady = true;
      loadVideo();
    };
  } else {
    apiReady = true;
  }

  onMount(() => {
    if (apiReady) {
      loadVideo();
    }
  });

  onDestroy(() => {
    player?.destroy();
  });

  const onPlayerReady = () => {
    videoReady = true;
  };

  const loadVideo = () => {
    player = new (window as any).YT.Player('nuclia-yt-player', {
      width: 'auto',
      height: 'auto',
      videoId: getYoutubeId(uri),
      playerVars: {
        playsinline: 1,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: onPlayerReady,
      },
    });
  };
</script>

<svelte:head>
  <script src="https://www.youtube.com/iframe_api"></script>
</svelte:head>

<div class="container">
  <div id="nuclia-yt-player" />
</div>

<style>
  .container {
    position: relative;
    padding-bottom: 56.25%;
    height: 0;
  }
  .container #nuclia-yt-player {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
</style>
