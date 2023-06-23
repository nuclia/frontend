<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import IconButton from '../button/IconButton.svelte';
  import { getFontColor } from '../../core/utils';

  export let clickable = false;
  export let removable = false;
  export let color = '';

  $: fontColor = color && getFontColor(color);

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
</script>

<div
  class="sw-chip"
  class:closeable={removable}
  style:background-color={color}
  style:color={fontColor}
  on:click={onClick}>
  <span
    class:clickable>
    <slot />
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

<style
  lang="scss"
  src="./Chip.scss"></style>
