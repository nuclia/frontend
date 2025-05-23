<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let selected = false;
  const dispatch = createEventDispatcher();
  const select = () => {
    dispatch('select');
  };
</script>

<li
  class="sw-option"
  role="menuitem"
  class:selected
  tabindex="0"
  on:click={() => select()}
  on:keyup={(e) => {
    if (e.key === 'Enter') select();
  }}>
  <slot />
</li>

<style
  lang="scss"
  src="./Option.scss"></style>
