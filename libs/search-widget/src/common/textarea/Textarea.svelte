<script lang="ts">
  import { createBubbler } from 'svelte/legacy';

  const bubble = createBubbler();
  import { createEventDispatcher } from 'svelte';
  import { isRightToLeft } from '../utils';

  interface Props {
    value?: string;
    name?: string;
    placeholder?: string;
    ariaLabel?: string;
  }

  let { value = $bindable(''), name = '', placeholder = '', ariaLabel = '' }: Props = $props();

  let element: HTMLTextAreaElement = $state();
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

<style
  lang="scss"
  src="./Textarea.scss"></style>
