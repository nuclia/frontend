<script lang="ts">
  import type { Observable } from 'rxjs';
  import { map } from 'rxjs';
  import { fieldData, getExtractedTexts } from '../../../../core';
  import type { Search } from '@nuclia/core';
  import PlainTextRenderer from './PlainTextRendering.svelte';
  import RstRenderer from './RstRendering.svelte';

  export let selectedParagraph: Search.FindParagraph | undefined;
  export let isRst = false;

  let textViewerElement: HTMLElement;
  let selected = '';

  $: !!selectedParagraph && textViewerElement && highlightSelection();

  let extractedTexts: Observable<{ shortId: string; text: string }[]> = fieldData.pipe(
    map((data) => getExtractedTexts(data)),
  );

  function highlightSelection() {
    if (!selectedParagraph) {
      return;
    }
    selected = selectedParagraph?.id.split('/').pop() || '';
    if (selected) {
      setTimeout(() =>
        textViewerElement?.querySelector(`#paragraph${selected}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
      );
    }
  }
</script>

<div
  class="sw-text-rendering"
  bind:this={textViewerElement}>
  {#if $extractedTexts}
    {#each $extractedTexts as paragraph}
      <p
        id="paragraph{paragraph.shortId}"
        class:highlight={paragraph.shortId === selected}>
        {#if isRst}
          <RstRenderer text={paragraph.text} />
        {:else}
          <PlainTextRenderer text={paragraph.text} />
        {/if}
      </p>
    {/each}
  {/if}
</div>

<!-- Style is the same for both TextContentRendering and ExtractedTextRendering, so the class is defined in _global.scss -->
