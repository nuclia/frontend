<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { _, getCDN } from '../../../../core';
  import { PlayerControls } from './';

  export let src;
  export let time;

  let wavesAnimation: HTMLVideoElement;
  let audio: HTMLMediaElement;

  let onError = false;
  let firstLoadDone = false;

  $: if (firstLoadDone && typeof time === 'number') {
    audio.currentTime = time;
    playAudioAndWaves();
  }

  const dispatch = createEventDispatcher();

  onMount(() => {
    if (src && !audio) {
      audio = new Audio(src);
      if (typeof time === 'number') {
        audio.currentTime = time;
      }

      audio.onended = () => {
        wavesAnimation.pause();
      };
      audio.oncanplay = () => {
        dispatch('audioReady');
        if (typeof time === 'number' && audio.paused) {
          playAudioAndWaves();
          firstLoadDone = true;
        }
      };
      audio.onerror = () => {
        onError = true;
        dispatch('error');
      };
    }
  });

  function playAudioAndWaves() {
    audio.play().then(() => {
      wavesAnimation.play();
    });
  }
</script>


<div class="sw-audio-player">
  {#if onError}
    <div class="error">{$_('error.audio-loading')}</div>
  {/if}
  <video
    class="waves-animation"
    src={`${getCDN()}tiles/audio-waves.mp4`}
    loop
    bind:this={wavesAnimation} />
  <PlayerControls player={audio}
                  on:play={() => wavesAnimation.play()}
                  on:pause={() => wavesAnimation.pause()}/>
</div>

<style
  lang="scss"
  src="./AudioPlayer.scss"></style>
