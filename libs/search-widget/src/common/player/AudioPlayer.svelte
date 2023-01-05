<script lang="ts">
  import IconButton from '../button/IconButton.svelte';
  import { onDestroy, onMount } from 'svelte';
  import { lightFormat } from 'date-fns';

  export let src;
  export let time;

  let currentTime = '';
  let totalTime = '';
  let timelineElement: HTMLElement;
  let volumeElement: HTMLElement;
  let audio: HTMLAudioElement;
  let progressIntervalId: number;

  let progress = 0;
  let playing = false;
  let displayVolume = false;

  onMount(() => {
    if (src) {
      audio = new Audio(src);
      if (time) {
        audio.currentTime = time;
      }
      audio.onloadeddata = onAudioLoaded;
      audio.onended = () => (playing = false);
      audio.oncanplay = () => {
        if (time && audio.paused) {
          play();
        }
      };
      progressIntervalId = setInterval(() => {
        progress = (audio.currentTime / audio.duration) * 100;
        currentTime = getFormattedTimeFromSeconds(audio.currentTime);
      }, 160);
    }
  });

  onDestroy(() => {
    clearInterval(progressIntervalId);
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
    audio.play().then(() => (playing = true));
  }

  function seekTime(event: MouseEvent) {
    const timelineWidth = timelineElement.offsetWidth;
    audio.currentTime = (event.offsetX / timelineWidth) * audio.duration;
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
</script>

<div class="sw-audio-player">
  <IconButton
    icon={playing ? 'pause' : audio?.currentTime === audio?.duration ? 'refresh' : 'play'}
    size="small"
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

<style
  lang="scss"
  src="./AudioPlayer.scss"></style>
