<script lang="ts">
  import DOMPurify from 'dompurify';
  import { createEventDispatcher } from 'svelte';
  import { isRightToLeft } from '../../../../common';
  import { getVendorsCDN } from '../../../../core/utils';
  import { unscapeMarkers } from '../../utils';

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

  function processHTML(text: string) {
    if (markers) {
      // marked.js escapes citation markers within <code> elements by default.
      // This behavior is reverted to correctly display the markers.
      text = unscapeMarkers(text);
    }
    return DOMPurify.sanitize(text);
  }
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
    {@html processHTML(marked.parse(trimmedText, { mangle: false, headerIds: false }))}
  </div>
{/if}

<style src="./MarkdownRendering.css"></style>
