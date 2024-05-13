<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import DOMPurify from 'dompurify';
  import { marked } from 'marked';

  const dispatch = createEventDispatcher();
  export let text = '';
  const BR = new RegExp(/<br>/g);
  let rendered = '';
  let bodyElement: HTMLElement;

  $: rendered = DOMPurify.sanitize(marked.parse(text.replace(BR, '\n')));

  onMount(() => setTimeout(() => dispatch('setElement', bodyElement), 500));
</script>

{#if rendered}
  <div
    bind:this={bodyElement}
    class="markdown">
    {@html rendered}
  </div>
{/if}

<style
  lang="scss"
  src="./MarkdownRendering.scss"></style>
