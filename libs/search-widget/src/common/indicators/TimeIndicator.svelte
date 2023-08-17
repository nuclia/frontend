<script lang="ts">
  import { formatTime } from '../../core/utils';
  import { createEventDispatcher } from 'svelte';
  import Icon from '../icons/Icon.svelte';

  export let start: number | undefined;
  export let selected = false;
  export let hover = false;
  export let minimized = false;

  const dispatch = createEventDispatcher();

  const play = () => {
    dispatch('play');
  };
</script>

{#if typeof start === 'number'}
  <button
    class="sw-indicator sw-time-indicator"
    class:selected
    class:minimized
    class:hovering={hover}
    on:click={play}
    on:keyup={(e) => {
      if (e.key === 'Enter') play();
    }}
    tabindex="0">
    <Icon
      name="play"
      size="small" />
    <div
      tabindex="-1"
      class="time-label">
      {formatTime(start)}
    </div>
  </button>
{/if}

<style
  lang="scss"
  src="./TimeIndicator.scss"></style>
