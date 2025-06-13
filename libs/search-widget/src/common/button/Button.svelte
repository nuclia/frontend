<script lang="ts">
  import { createBubbler } from 'svelte/legacy';

  const bubble = createBubbler();
  interface Props {
    aspect?: string; // solid or basic
    kind?: string; // primary | secondary
    size?: string; // medium or small
    active?: boolean;
    disabled?: boolean;
    type?: string;
    children?: import('svelte').Snippet;
  }

  let {
    aspect = 'solid',
    kind = 'secondary',
    size = 'medium',
    active = false,
    disabled = false,
    type = 'button',
    children,
  }: Props = $props();
  let label: HTMLSpanElement = $state();
</script>

<button
  class="sw-button {aspect} {kind}"
  class:small={size === 'small'}
  class:active
  {type}
  aria-label={label ? label.textContent : ''}
  tabindex="0"
  {disabled}
  onclick={bubble('click')}>
  <span
    tabindex="-1"
    class="button-label"
    bind:this={label}>
    {@render children?.()}
  </span>
</button>

<style src="./Button.css"></style>
