<script lang="ts">
  import { run } from 'svelte/legacy';

  import type { Search } from '@nuclia/core';
  import type { Observable } from 'rxjs';
  import { map } from 'rxjs';
  import { fieldData, getExtractedTexts } from '../../../../core';
  import PlainTextRenderer from './PlainTextRendering.svelte';
  import RstRenderer from './RstRendering.svelte';

  interface Props {
    selectedParagraph: Search.FindParagraph | undefined;
    isRst?: boolean;
  }

  let { selectedParagraph, isRst = false }: Props = $props();

  let textViewerElement: HTMLElement = $state();
  let selected = $state('');

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
        textViewerElement
          ?.querySelector(`#paragraph${selected}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
      );
    }
  }
  run(() => {
    !!selectedParagraph && textViewerElement && highlightSelection();
  });
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

<!-- Style is the same for both TextContentRendering and ExtractedTextRendering, so the class is defined in global.css -->
