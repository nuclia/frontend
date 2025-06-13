<script lang="ts">
  import { run } from 'svelte/legacy';

  import { lightFormat } from 'date-fns';
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { IconButton } from '../../../../common';

  let { player = $bindable() } = $props();

  const dispatch = createEventDispatcher();
  let timelineElement: HTMLElement = $state();
  let volumeElement: HTMLElement = $state();
  let displayVolume = $state(false);
  let progressIntervalId: number;
  let currentTime = $state('');
  let totalTime = $state('');
  let progress = $state(0);
  let playing = $state(false);

  onMount(() => {
    progressIntervalId = setInterval(() => {
      if (player) {
        progress = (player.currentTime / player.duration) * 100;
        currentTime = getFormattedTimeFromSeconds(player.currentTime);
      }
    }, 160);
  });

  onDestroy(() => {
    clearInterval(progressIntervalId);
    if (player && !player.paused) {
      player.pause();
    }
  });

  function getFormattedTimeFromSeconds(seconds: number): string {
    let date = new Date('2022T00:00:00');
    date.setSeconds(seconds);
    return seconds >= 3600 ? lightFormat(date, 'h:mm:ss') : lightFormat(date, 'm:ss');
  }

  function toggleVolume() {
    displayVolume = !displayVolume;
  }

  function updateVolume(event: MouseEvent) {
    const volumeRect = volumeElement.getBoundingClientRect();
    const volumeHeight = volumeElement.offsetHeight;
    const level = volumeHeight - (event.clientY - volumeRect.y);
    player.volume = level <= 5 ? 0 : level / volumeHeight;
  }

  function seekTime(event: MouseEvent) {
    const timelineWidth = timelineElement.offsetWidth;
    player.currentTime = (event.offsetX / timelineWidth) * player.duration;
  }

  function handleKeydown(event) {
    if (event.target.tagName.toLowerCase() !== 'input' && event.code === 'Space') {
      event.stopPropagation();
      event.preventDefault();
      togglePlay();
    }
  }

  function togglePlay() {
    if (!player.paused) {
      player.pause();
      dispatch('pause');
    } else {
      if (player.currentTime === player.duration) {
        player.currentTime = 0;
        progress = 0;
      }
      player.play();
      dispatch('play');
    }
    playing = !player.paused;
  }

  run(() => {
    if (player) {
      // don't override existing callbacks
      const onLoadedData = player.onloadeddata;
      const onEnded = player.onended;
      const onPlay = player.onplay;
      // add callbacks needed for PlayerControls
      player.onloadeddata = () => {
        totalTime = getFormattedTimeFromSeconds(player.duration);
        currentTime = getFormattedTimeFromSeconds(player.currentTime);
        player.volume = 0.75;
        if (typeof onLoadedData === 'function') {
          onLoadedData();
        }
      };
      player.onplay = () => {
        playing = true;
        if (typeof onPlay === 'function') {
          onPlay();
        }
      };
      player.onended = () => {
        playing = false;
        if (typeof onEnded === 'function') {
          onEnded();
        }
      };
    }
  });
</script>

<svelte:window onkeydown={handleKeydown} />
<div class="sw-player-controls">
  <IconButton
    icon={playing ? 'pause' : player?.currentTime === player?.duration ? 'refresh' : 'play'}
    size="small"
    aspect="solid"
    on:click={togglePlay} />
  <div class="time">{currentTime}</div>
  <div
    class="timeline"
    bind:this={timelineElement}
    onclick={(event) => seekTime(event)}>
    <div
      class="progress"
      style:width={`${progress}%`}>
    </div>
  </div>
  <div class="time">{totalTime}</div>
  <IconButton
    icon={!player?.volume ? 'volume-mute' : player.volume > 0.5 ? 'volume-high' : 'volume-low'}
    size="small"
    aspect="basic"
    on:click={toggleVolume} />
  <div
    class="volume-container"
    class:visible={displayVolume}>
    <div
      class="volume"
      bind:this={volumeElement}
      onclick={(event) => updateVolume(event)}>
      <div
        class="level"
        style:height={`${player?.volume * 100}%`}>
      </div>
    </div>
  </div>
</div>

<style src="./PlayerControls.css"></style>
