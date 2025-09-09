<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { getYoutubeId } from '../../../../core/utils';

  interface Props {
    uri: string;
    time: number;
  }

  let { uri, time }: Props = $props();
  let playerElement: HTMLElement | undefined = $state();
  let player: any = $state();
  let apiReady = false;
  let videoReady = $state(false);
  let paused = false;
  const dispatch = createEventDispatcher();

  $effect(() => {
    if (videoReady && typeof time === 'number') {
      player?.seekTo(time);
      player?.playVideo();
    }
  });

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
            onStateChange: (event) => {
              paused = event.data === youtube.PlayerState.PAUSED;
            },
          },
        });
        clearInterval(waitForPlayer);
      }
    }, 300);
  };

  function handleKeydown(event) {
    if (videoReady && event.target.tagName.toLowerCase() !== 'input' && event.code === 'Space') {
      event.stopPropagation();
      event.preventDefault();
      if (paused) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    }
  }
</script>

<svelte:head>
  <script src="https://www.youtube.com/iframe_api"></script>
</svelte:head>
<svelte:window onkeydown={handleKeydown} />
<div class="sw-youtube">
  <div
    class="player"
    bind:this={playerElement}>
  </div>
</div>

<style src="./YoutubePlayer.css"></style>
