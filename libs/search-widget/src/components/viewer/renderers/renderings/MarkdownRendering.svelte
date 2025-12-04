<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { isRightToLeft } from '../../../../common';
  import { getVendorsCDN } from '../../../../core/utils';
  import { markdownToHTML } from '../../../../core';

  const dispatch = createEventDispatcher();
  interface Props {
    text?: string;
    markers?: boolean;
  }

  let { text = '', markers = false }: Props = $props();

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
    src={`${getVendorsCDN()}/marked.min.js`}
    onload={onMarkedLoaded}></script>
</svelte:head>

{#if markedLoaded && trimmedText}
  <div
    bind:this={bodyElement}
    class="markdown"
    style:direction={isRTL ? 'rtl' : 'ltr'}>
    {@html markdownToHTML(trimmedText, true)}
  </div>
{/if}

<style src="./MarkdownRendering.css"></style>
