<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { createBubbler } from 'svelte/legacy';
  import { isRightToLeft } from '../utils';

  const bubble = createBubbler();
  interface Props {
    value?: string;
    name?: string;
    placeholder?: string;
    ariaLabel?: string;
    disabled?: boolean;
  }

  let { value = $bindable(''), name = '', placeholder = '', ariaLabel = '', disabled = false }: Props = $props();

  let element: HTMLTextAreaElement | undefined = $state();
  let isRTL = $derived(isRightToLeft(value));

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
    {disabled}
    tabindex="0"
    autocomplete="off"
    autocapitalize="off"
    spellcheck="false"
    aria-label={ariaLabel}
    style:direction={isRTL ? 'rtl' : 'ltr'}
    bind:value
    oninput={bubble('input')}
    onkeypress={onKeyPress}
    onkeyup={onKeyUp}>
  </textarea>
</div>

<style src="./Textarea.css"></style>
