<script lang="ts">
  import IconButton from '../button/IconButton.svelte';
  import { onDestroy, onMount } from 'svelte';
  import { lightFormat } from 'date-fns';

  export let src;
  export let time;

  let currentTime = '';
  let totalTime = '';
  let timelineElement: HTMLElement;
  let audio: HTMLAudioElement;
  let progressIntervalId: number;

  let progress = 0;
  let playing = false;

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
</script>

<div class="sw-audio-player">
  <div class="play-button">
    <IconButton
      icon={playing ? 'pause' : audio?.currentTime === audio?.duration ? 'refresh' : 'play'}
      size="small"
      on:click={togglePlay} />
  </div>
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
</div>

<style
  lang="scss"
  src="./AudioPlayer.scss"></style>
