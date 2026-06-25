<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let selected = false;
  const dispatch = createEventDispatcher();
  const select = () => {
    dispatch('select');
  };
</script>

<div
  class="sw-option"
  role="menuitem"
  class:selected
  tabindex="0"
  on:click={() => select()}
  on:keyup={(e) => {
    if (e.key === 'Enter') select();
  }}>
  <slot />
</div>

<style src="./Option.css"></style>
