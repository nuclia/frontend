<script lang="ts">
  import type { Observable } from 'rxjs';
  import { map } from 'rxjs';
  import { getUnMarked } from '../tile.utils';
  import { getExtractedTexts } from '../../core/utils';
  import { fieldData } from '../../core/stores/viewer.store';

  export let selectedParagraph;

  let textViewerElement: HTMLElement;
  let selectedIndex = -1;

  $: !!selectedParagraph && textViewerElement && highlightSelection();

  let extractedTexts: Observable<string[]> = fieldData.pipe(map((data) => getExtractedTexts(data)));

  function highlightSelection() {
    const unmarkSelection = getUnMarked(selectedParagraph.text);
    if (unmarkSelection) {
      extractedTexts.subscribe((texts) => {
        selectedIndex = texts.findIndex((text) => text === unmarkSelection);
        if (selectedIndex > -1) {
          setTimeout(() =>
            textViewerElement.querySelector(`#paragraph${selectedIndex}`)?.scrollIntoView({ behavior: 'smooth' }),
          );
        }
      });
    }
  }
</script>

<div
  class="sw-text-viewer"
  bind:this={textViewerElement}>
  {#if $extractedTexts}
    {#each $extractedTexts as text, index}
      <p
        id="paragraph{index}"
        class:highlight={index === selectedIndex}>
        {text}
      </p>
    {/each}
  {/if}
</div>

<style
  lang="scss"
  src="./TextViewer.scss"></style>
