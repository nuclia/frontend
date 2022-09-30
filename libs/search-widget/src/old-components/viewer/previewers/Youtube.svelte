<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { getYoutubeId } from '../../../core/utils';

  export let uri: string;
  export let time: number;
  let playerElement: HTMLElement;
  let player: any;
  let apiReady = false;
  let videoReady = false;
  const dispatch = createEventDispatcher();

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
    dispatch('videoReady');
  };

  const loadVideo = () => {
    const waitForPlayer = window.setInterval(() => {
      const youtube = (window as any).YT;
      if (youtube) {
        player = new youtube.Player(playerElement, {
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
        clearInterval(waitForPlayer);
      }
    }, 300);
  };
</script>

<svelte:head>
  <script src="https://www.youtube.com/iframe_api"></script>
</svelte:head>

<div class="sw-youtube">
  <div class="player" bind:this={playerElement} />
</div>

<style lang="scss" src="./Youtube.scss"></style>
