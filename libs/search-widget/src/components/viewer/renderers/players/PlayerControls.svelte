<script lang="ts">
  import { lightFormat } from 'date-fns';
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { IconButton } from '../../../../common';
  import { _ } from '../../../../core/i18n';

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
  let volume = $state(0.75);

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
    volume = player.volume;
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

  function seekByKey(event: KeyboardEvent) {
    if (!player) return;
    const step = player.duration / 20; // 5% steps
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      player.currentTime = Math.min(player.duration, player.currentTime + step);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      player.currentTime = Math.max(0, player.currentTime - step);
    } else if (event.key === 'Home') {
      event.preventDefault();
      player.currentTime = 0;
    } else if (event.key === 'End') {
      event.preventDefault();
      player.currentTime = player.duration;
    }
  }

  function changeVolumeByKey(event: KeyboardEvent) {
    if (!player) return;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      player.volume = Math.min(1, player.volume + 0.1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      player.volume = Math.max(0, player.volume - 0.1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      player.volume = 0;
    } else if (event.key === 'End') {
      event.preventDefault();
      player.volume = 1;
    }
    volume = player.volume;
  }

  $effect(() => {
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
        volume = 0.75;
        if (typeof onLoadedData === 'function') {
          onLoadedData();
        }
      };
      player.onvolumechange = () => {
        volume = player.volume;
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
    ariaLabel={playing ? $_('player.pause') : player?.currentTime === player?.duration ? $_('player.restart') : $_('player.play')}
    size="small"
    aspect="solid"
    on:click={togglePlay} />
  <div class="time">{currentTime}</div>
  <div
    class="timeline"
    bind:this={timelineElement}
    role="slider"
    tabindex="0"
    aria-label={$_('player.seek')}
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={Math.round(progress)}
    aria-valuetext={currentTime}
    onclick={(event) => seekTime(event)}
    onkeydown={seekByKey}>
    <div
      class="progress"
      style:width={`${progress}%`}>
    </div>
  </div>
  <div class="time">{totalTime}</div>
  <IconButton
    icon={!volume ? 'volume-mute' : volume > 0.5 ? 'volume-high' : 'volume-low'}
    ariaLabel={$_('player.volume')}
    size="small"
    aspect="basic"
    on:click={toggleVolume} />
  <div
    class="volume-container"
    class:visible={displayVolume}>
    <div
      class="volume"
      bind:this={volumeElement}
      role="slider"
      tabindex="0"
      aria-label={$_('player.volume')}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={Math.round(volume * 100)}
      aria-orientation="vertical"
      onclick={(event) => updateVolume(event)}
      onkeydown={changeVolumeByKey}>
      <div
        class="level"
        style:height={`${volume * 100}%`}>
      </div>
    </div>
  </div>
</div>

<style src="./PlayerControls.css"></style>
