<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { getFontColor } from '../../core/utils';
  import IconButton from '../button/IconButton.svelte';

  interface Props {
    clickable?: boolean;
    removable?: boolean;
    color?: string;
    children?: import('svelte').Snippet;
  }

  let { clickable = false, removable = false, color = '', children }: Props = $props();

  let fontColor = $derived(color && getFontColor(color));

  const dispatch = createEventDispatcher();
  const remove = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dispatch('remove');
  };
  const onClick = (event: MouseEvent | KeyboardEvent) => {
    if (clickable) {
      event.preventDefault();
      event.stopPropagation();
      dispatch('click');
    }
  };
  const onKeyup = (event: KeyboardEvent) => {
    if (clickable && event.key === 'Enter') {
      dispatch('click');
    }
  };
</script>

<div
  class="sw-chip"
  class:closeable={removable}
  class:clickable
  style:background-color={color}
  style:color={fontColor}
  tabindex={clickable ? 0 : -1}
  onclick={onClick}
  onkeyup={onKeyup}>
  <span>
    {@render children?.()}
  </span>
  {#if removable}
    <IconButton
      icon="cross"
      ariaLabel="Delete"
      aspect="basic"
      size="xsmall"
      on:click={(event) => remove(event)} />
  {/if}
</div>

<style src="./Chip.css"></style>
