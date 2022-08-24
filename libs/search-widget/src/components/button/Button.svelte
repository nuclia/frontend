<script lang="ts">
  export let aspect = 'solid'; // solid or basic
  export let size = 'medium'; // medium or small
  export let disabled = false;
  export let type = 'button';
  let label: HTMLSpanElement;
</script>

<button
  class="button {aspect}"
  class:small={size === 'small'}
  {type}
  aria-label={label ? label.textContent : ''}
  tabindex="0"
  {disabled}
  on:click
>
  <span tabindex="-1" class="button-label" bind:this={label}><slot /></span>
</button>

<style>
  @import "button.css";
</style>
