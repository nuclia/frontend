<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { formatTime } from '../../core/utils';
  import Icon from '../icons/Icon.svelte';

  interface Props {
    start: number | undefined;
    selected?: boolean;
    hover?: boolean;
    minimized?: boolean;
  }

  let { start, selected = false, hover = false, minimized = false }: Props = $props();

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
    onclick={play}
    onkeyup={(e) => {
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

<style src="./TimeIndicator.css"></style>
