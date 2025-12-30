<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { scale } from 'svelte/transition';
  import { Icon } from '../../common';

  interface Props {
    position?: 'bottom-right' | 'bottom-left';
    size?: 'small' | 'medium' | 'large';
    offsetBottom?: number;
    offsetSide?: number;
  }

  let {
    position = 'bottom-right',
    size = 'medium',
    offsetBottom = 24,
    offsetSide = 24,
  }: Props = $props();

  const dispatch = createEventDispatcher();

  function handleClick() {
    dispatch('open');
  }

  const positionStyle = $derived(
    position === 'bottom-right'
      ? `bottom: ${offsetBottom}px; right: ${offsetSide}px;`
      : `bottom: ${offsetBottom}px; left: ${offsetSide}px;`
  );
</script>

<button
  class="fab {size}"
  style="{positionStyle}"
  onclick={handleClick}
  aria-label="Open chat"
  type="button"
  transition:scale={{ duration: 200 }}>
  <Icon name="chat" />
</button>

<style src="./FAB.css"></style>
