<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import DOMPurify from 'dompurify';

  const dispatch = createEventDispatcher();
  export let text = '';

  $: trimmedText = text.trim();
  let bodyElement: HTMLElement;
  let markedLoaded = false;
  const onMarkedLoaded = () => {
    markedLoaded = true;
    setTimeout(() => dispatch('setElement', bodyElement), 500);
  };
</script>

<svelte:head>
  <script
    src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"
    on:load={onMarkedLoaded}></script>
</svelte:head>

{#if markedLoaded && trimmedText}
  <div
    bind:this={bodyElement}
    class="markdown">
    {@html DOMPurify.sanitize(marked.parse(trimmedText, { mangle: false, headerIds: false }))}
  </div>
{/if}

<style
  lang="scss"
  src="./MarkdownRendering.scss"></style>
