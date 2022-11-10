<script lang="ts">
  import { formatTime } from '../../core/utils';
  import { createEventDispatcher } from 'svelte';
  import Icon from '../icons/Icon.svelte';

  export let start = 0;
  export let selected = false;
  export let hover = false;
  export let minimized = false;

  const dispatch = createEventDispatcher();

  const play = () => {
    dispatch('play');
  };
</script>

<div
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
</div>

<style
  lang="scss"
  src="./TimeIndicator.scss"></style>
