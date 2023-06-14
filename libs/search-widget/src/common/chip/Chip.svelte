<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import IconButton from '../button/IconButton.svelte';
  import { getFontColor } from '../../core/utils';

  export let clickable = false;
  export let removable = false;
  export let color = '';

  $: fontColor = getFontColor(color);

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
  on:click={onClick}>
  <span
    style:color={fontColor}
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
