<script lang="ts">
  export let aspect = 'solid'; // solid or basic
  export let kind = 'secondary'; // primary | secondary | inverted
  export let size = 'medium'; // medium or small
  export let active = false;
  export let disabled = false;
  export let type = 'button';
  let label: HTMLSpanElement;
</script>

<button
  class="sw-button {aspect} {kind}"
  class:small={size === 'small'}
  class:active
  {type}
  aria-label={label ? label.textContent : ''}
  tabindex="0"
  {disabled}
  on:click>
  <span
    tabindex="-1"
    class="button-label"
    bind:this={label}>
    <slot />
  </span>
</button>

<style
  lang="scss"
  src="./Button.scss"></style>
