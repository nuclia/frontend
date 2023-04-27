<script lang="ts">
  import type { Observable } from 'rxjs';
  import { map } from 'rxjs';
  import { getUnMarked } from '../tile.utils';
  import { getExtractedTexts } from '../../core/utils';
  import { fieldData } from '../../core/stores/viewer.store';
  import type { WidgetParagraph } from '../../core/models';
  import type { Search } from '@nuclia/core';

  export let selectedParagraph: WidgetParagraph | undefined;

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
    selected = (selectedParagraph.paragraph as Search.FindParagraph)?.id.split('/').pop() || '';
    if (selected) {
      setTimeout(() =>
        textViewerElement?.querySelector(`#paragraph${selected}`)?.scrollIntoView({ behavior: 'smooth' }),
      );
    }
  }
</script>

<div
  class="sw-text-viewer"
  bind:this={textViewerElement}>
  {#if $extractedTexts}
    {#each $extractedTexts as paragraph}
      <p
        id="paragraph{paragraph.shortId}"
        class:highlight={paragraph.shortId === selected}>
        {paragraph.text}
      </p>
    {/each}
  {/if}
</div>

<style
  lang="scss"
  src="./TextViewer.scss"></style>
