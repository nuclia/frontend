<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { clickOutside } from '../actions/actions';

  export let position: { top: number; left: number } | undefined = undefined;

  const dispatch = createEventDispatcher();
  const close = () => {
    dispatch('close');
  };
</script>

<div
  class="sw-dropdown"
  style:left={position?.left + 'px'}
  style:top={position?.top + 'px'}
  use:clickOutside
  on:outclick={close}>
  <slot />
</div>

<style
  lang="scss"
  src="./Dropdown.scss"></style>
