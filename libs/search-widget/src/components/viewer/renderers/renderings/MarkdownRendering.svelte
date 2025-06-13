<script lang="ts">
  import DOMPurify from 'dompurify';
  import { createEventDispatcher } from 'svelte';
  import { isRightToLeft } from '../../../../common';

  const dispatch = createEventDispatcher();
  interface Props {
    text?: string;
  }

  let { text = '' }: Props = $props();

  let trimmedText = $derived(text.trim());
  let isRTL = $derived(isRightToLeft(trimmedText));
  let bodyElement: HTMLElement = $state();
  let markedLoaded = $state(false);
  const onMarkedLoaded = () => {
    markedLoaded = true;
    setTimeout(() => dispatch('setElement', bodyElement), 500);
  };
</script>

<svelte:head>
  <script
    src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"
    onload={onMarkedLoaded}></script>
</svelte:head>

{#if markedLoaded && trimmedText}
  <div
    bind:this={bodyElement}
    class="markdown"
    style:direction={isRTL ? 'rtl' : 'ltr'}>
    {@html DOMPurify.sanitize(marked.parse(trimmedText, { mangle: false, headerIds: false }))}
  </div>
{/if}

<style src="./MarkdownRendering.css"></style>
