<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { clickOutside } from '../actions/actions';
  import { freezeBackground, unblockBackground } from '../modal/modal.utils';

  export let position: { top?: number; bottom?: number; left: number; width: number } | undefined = undefined;
  export let secondary = false;

  onMount(() => {
    if (!secondary) {
      freezeBackground();
      return () => {
        unblockBackground();
      };
    }
  });

  const dispatch = createEventDispatcher();
  const close = () => {
    dispatch('close');
  };
</script>

<div
  class="sw-dropdown"
  style:left={position?.left + 'px'}
  style:top={typeof position?.top === 'number' ?  position?.top + 'px' : 'auto'}
  style:bottom={typeof position?.bottom === 'number' ?  position?.bottom + 'px' : 'auto'}
  style:width={position?.width + 'px'}
  use:clickOutside
  on:outclick={close}>
  <slot />
</div>

<style
  lang="scss"
  src="./Dropdown.scss"></style>
