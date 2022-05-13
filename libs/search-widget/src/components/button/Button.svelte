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
  .button {
    background: transparent;
    border: none;
    border-radius: var(--border-radius);
    display: inline-flex;
    justify-content: center;
    padding: 0;
    margin: 0;
    outline: 0;
    transition: background-color 0.16s ease-in-out, box-shadow 0.16s ease-in;
    white-space: nowrap;
    font-size: var(--font-size-base);
    line-height: var(--line-height-body);
    padding: 0.4em 0.5em;
    font-family: inherit;
  }
  .button:not(:disabled) {
    cursor: pointer;
  }
  .small {
    font-size: calc(var(--font-size-base) * 0.75);
    line-height: calc(var(--line-height-body) * 0.75);
  }
  .solid {
    color: var(--color-light-stronger);
    background: var(--color-primary-regular);
    border: var(--color-primary-regular);
  }
  .basic {
    color: var(--color-primary-regular);
    background: transparent;
    border: var(--color-primary-regular);
  }
  .button-label {
    font-weight: var(--font-weight-semi-bold);
    display: flex;
    align-items: center;
  }
</style>
