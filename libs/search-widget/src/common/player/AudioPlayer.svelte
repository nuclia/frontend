<script lang="ts">
  import IconButton from '../button/IconButton.svelte';
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { lightFormat } from 'date-fns';
  import { getCDN } from '../../core/utils';
  import { _ } from '../../core/i18n';

  export let src;
  export let time;

  let currentTime = '';
  let totalTime = '';
  let wavesAnimation: HTMLVideoElement;
  let timelineElement: HTMLElement;
  let volumeElement: HTMLElement;
  let audio: HTMLAudioElement;
  let progressIntervalId: number;

  let progress = 0;
  let playing = false;
  let displayVolume = false;
  let onError = false;
  let firstLoadDone = false;

  $: if (firstLoadDone && typeof time === 'number') {
    audio.currentTime = time;
    play();
  }

  const dispatch = createEventDispatcher();

  onMount(() => {
    if (src) {
      audio = new Audio(src);
      if (typeof time === 'number') {
        audio.currentTime = time;
      }
      audio.onloadeddata = onAudioLoaded;
      audio.onended = () => (playing = false);
      audio.oncanplay = () => {
        dispatch('audioReady');
        if (typeof time === 'number' && audio.paused) {
          play();
          firstLoadDone = true;
        }
      };
      audio.onerror = () => {
        onError = true;
        dispatch('error');
      };
      progressIntervalId = setInterval(() => {
        progress = (audio.currentTime / audio.duration) * 100;
        currentTime = getFormattedTimeFromSeconds(audio.currentTime);
      }, 160);
    }
  });

  onDestroy(() => {
    clearInterval(progressIntervalId);
    audio.pause();
  });

  function onAudioLoaded() {
    totalTime = getFormattedTimeFromSeconds(audio.duration);
    currentTime = getFormattedTimeFromSeconds(audio.currentTime);
    audio.volume = 0.75;
  }

  function togglePlay() {
    if (!audio.paused) {
      audio.pause();
      playing = false;
      wavesAnimation.pause();
    } else {
      if (audio.currentTime === audio.duration) {
        audio.currentTime = 0;
        progress = 0;
      }
      play();
    }
  }

  function toggleVolume() {
    displayVolume = !displayVolume;
  }

  function play() {
    audio.play().then(() => {
      playing = true;
      wavesAnimation.play();
    });
  }

  function seekTime(event: MouseEvent) {
    if (!onError) {
      const timelineWidth = timelineElement.offsetWidth;
      audio.currentTime = (event.offsetX / timelineWidth) * audio.duration;
    }
  }

  function getFormattedTimeFromSeconds(seconds: number): string {
    let date = new Date('2022T00:00:00');
    date.setSeconds(seconds);
    return seconds >= 3600 ? lightFormat(date, 'h:mm:ss') : lightFormat(date, 'm:ss');
  }

  function updateVolume(event: MouseEvent) {
    const volumeRect = volumeElement.getBoundingClientRect();
    const volumeHeight = volumeElement.offsetHeight;
    const level = volumeHeight - (event.clientY - volumeRect.y);
    audio.volume = level <= 5 ? 0 : level / volumeHeight;
  }

  function handleKeydown(event) {
    if (event.code === 'Space') {
      togglePlay();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />
<div class="sw-audio-player">
  {#if onError}
    <div class="error">{$_('error.audio-loading')}</div>
  {/if}
  <video
    class="waves-animation"
    src={`${getCDN()}tiles/audio-waves.mp4`}
    loop
    bind:this={wavesAnimation} />
  <div class="audio-controls">
    <IconButton
      icon={playing ? 'pause' : audio?.currentTime === audio?.duration ? 'refresh' : 'play'}
      size="small"
      disabled={onError}
      aspect="basic"
      on:click={togglePlay} />
    <div class="time">{currentTime}</div>
    <div
      class="timeline"
      bind:this={timelineElement}
      on:click={(event) => seekTime(event)}>
      <div
        class="progress"
        style:width={`${progress}%`} />
    </div>
    <div class="time">{totalTime}</div>
    <IconButton
      icon={!audio?.volume ? 'volume-mute' : audio.volume > 0.5 ? 'volume-high' : 'volume-low'}
      size="small"
      aspect="basic"
      on:click={toggleVolume} />
    <div
      class="volume-container"
      class:visible={displayVolume}>
      <div
        class="volume"
        bind:this={volumeElement}
        on:click={(event) => updateVolume(event)}>
        <div
          class="level"
          style:height={`${audio?.volume * 100}%`} />
      </div>
    </div>
  </div>
</div>

<style
  lang="scss"
  src="./AudioPlayer.scss"></style>
