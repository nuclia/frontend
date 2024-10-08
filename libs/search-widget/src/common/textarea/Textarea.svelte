<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { isRightToLeft } from '../utils';

  export let value = '';
  export let name = '';
  export let placeholder = '';
  export let ariaLabel = '';

  let element: HTMLTextAreaElement;
  $: isRTL = isRightToLeft(value);

  const dispatch = createEventDispatcher();

  export function blur() {
    element?.blur();
  }
  export function focus() {
    element?.focus();
  }

  function onKeyUp(event: KeyboardEvent) {
    if (!(event.key === 'Enter' && (event.shiftKey || event.ctrlKey || event.altKey))) {
      dispatch('keyup', event);
    }
  }
  function onKeyPress(event: KeyboardEvent) {
    if (!(event.key === 'Enter' && (event.shiftKey || event.ctrlKey || event.altKey))) {
      dispatch('keypress', event);
    }
  }
</script>

<div class="sw-textarea">
  <pre aria-hidden="true">{value + '\n'}</pre>
  <textarea
    bind:this={element}
    {name}
    {placeholder}
    tabindex="0"
    autocomplete="off"
    autocapitalize="off"
    spellcheck="false"
    aria-label={ariaLabel}
    style:direction={isRTL ? 'rtl' : 'ltr'}
    bind:value
    on:input
    on:keypress={onKeyPress}
    on:keyup={onKeyUp} />
</div>

<style
  lang="scss"
  src="./Textarea.scss"></style>
