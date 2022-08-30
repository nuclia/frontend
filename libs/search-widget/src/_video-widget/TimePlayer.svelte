<script>
  import {formatTime} from '../core/utils';
  import {createEventDispatcher} from "svelte";
  import Icon from "./Icon.svelte";

  export let time = 0;
  export let selected = false;

  const dispatch = createEventDispatcher();

  const play = () => {
    dispatch('play');
  }
</script>

<div class="time-player"
     class:selected={selected}
     on:click={play}
     on:keyup={(e) => { if (e.key === 'Enter') play(); }}
     tabindex="0">
  <Icon name="play" size="small"/>
  <div tabindex="-1">{formatTime(time)}</div>
</div>

<style>
  .time-player {
    align-items: center;
    background: var(--color-neutral-lightest);
    border-radius: var(--rhythm-4);
    cursor: pointer;
    display: flex;
    gap: var(--rhythm-0_25);
    line-height: var(--rhythm-3);
    max-width: var(--rhythm-8);
    padding: 0 var(--rhythm-1);
  }
  .time-player:hover {
    background: var(--color-neutral-light);
  }
  .time-player:active {
    background: var(--color-neutral-regular);
  }
  .time-player:focus {
    box-shadow: var(--focus-shadow);
    outline: 0;
  }

  .time-player.selected {
    background: var(--color-primary-lightest);
    color: var(--color-primary-regular);
  }
  .time-player.selected:hover {
    background: var(--color-primary-lighter);
  }
  .time-player.selected:active {
    background: var(--color-primary-light);
    color: var(--color-light-stronger);
  }
</style>
