<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getRegionalBackend } from '../../core/api';

  export let src: string;
  export let type: string;
  export let time: number = null;
  let firstLoad: boolean = false;
  let currentTime: number = null;
  let paused: boolean = true;
  let player: HTMLMediaElement;
  let isVideo: boolean;

  onDestroy(() => {
    if (player && !paused) {
      player.pause();
    }
  });

  $: if (firstLoad && typeof time === 'number') {
    currentTime = time;
    play();
  }

  $: isVideo = type.slice(0, 5) === 'video';

  const play = () => {
    if (paused) {
      player.play();
    }
  };
</script>

<div class="player">
  {#if isVideo}
    <div class="video-container">
      <video
        preload="auto"
        crossorigin="anonymous"
        controls
        on:canplay={() => {
          if (!firstLoad) firstLoad = true;
        }}
        bind:this={player}
        bind:currentTime
        bind:paused
      >
        <source {src} {type} />
        <track kind="captions" />
      </video>
    </div>
  {:else}
    <audio
      preload="auto"
      crossorigin="anonymous"
      controls
      on:canplay={() => {
        if (!firstLoad) firstLoad = true;
      }}
      bind:this={player}
      bind:currentTime
      bind:paused
    >
      <source {src} {type} />
    </audio>
  {/if}
</div>

<style>
  .video-container {
    position: relative;
    width: 100%;
    padding-top: 56.25%;
    background-color: #000;
  }
  video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  audio {
    width: 100%;
  }
</style>
