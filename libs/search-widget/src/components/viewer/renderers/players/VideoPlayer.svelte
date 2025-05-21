<script lang="ts">
  import { run } from 'svelte/legacy';

  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { getTempToken, isPrivateKnowledgeBox } from '../../../../core';
  import { PlayerControls } from './index';

  let { src, time, contentType } = $props();

  let isDashVideo = $derived(contentType === 'text/xml');

  const dispatch = createEventDispatcher();

  let player: HTMLMediaElement = $state();
  let dashPlayer: any;
  let loaded = $state(false);
  let paused = true;

  run(() => {
    if (loaded && typeof time === 'number') {
      if (player) {
        player.currentTime = time;

        if (paused) {
          player.play();
        }
      }
    }
  });

  onDestroy(() => {
    if (dashPlayer) {
      dashPlayer.reset();
      dashPlayer.destroy();
    }
  });

  function canPlay() {
    if (!loaded) {
      loaded = true;
    }
    dispatch('videoReady');
  }

  function onLoadDash() {
    if (isPrivateKnowledgeBox()) {
      getTempToken().subscribe((token) => {
        initDash(token);
      });
    } else {
      initDash();
    }
  }

  function initDash(token?: string) {
    const dashjs = (window as any)['dashjs'];
    if (dashjs) {
      dashPlayer = dashjs.MediaPlayer().create();
      dashPlayer.extend('RequestModifier', () => {
        return {
          modifyRequestHeader: (xhr: any) => xhr,
          modifyRequestURL: (url: string) => {
            if (token && url.indexOf('eph-token') < 0) {
              return url + `?eph-token=${token}`;
            }
            return url;
          },
        };
      });
      dashPlayer.initialize(player, src, true);
    }
  }
</script>

<svelte:head>
  {#if isDashVideo}
    <script
      src="https://cdn.dashjs.org/v4.7.1/dash.all.min.js"
      onload={onLoadDash}></script>
  {/if}
</svelte:head>

<div class="sw-video-player">
  <video
    preload="auto"
    crossorigin="anonymous"
    oncanplay={canPlay}
    bind:this={player}>
    <source
      {src}
      type={contentType} />
  </video>
  <PlayerControls {player} />
</div>

<style
  lang="scss"
  src="./VideoPlayer.scss"></style>
