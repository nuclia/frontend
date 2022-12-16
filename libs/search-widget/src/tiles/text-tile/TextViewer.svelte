<script lang="ts">
  import { Resource } from '@nuclia/core';
  import { map, Observable } from 'rxjs';
  import { getFields, getFieldType } from '../../core/old-stores/viewer.store';
  import { getUnMarked } from '../tile.utils';

  export let resource: Observable<Resource>;
  export let selectedParagraph;

  let textViewerElement: HTMLElement;
  let selectedIndex = -1;

  $: !!selectedParagraph && textViewerElement && highlightSelection();


  let extractedTexts: Observable<string[]> = resource?.pipe(
    map((resource) => {
      const fields = getFields(resource).filter((field) => !!field.field.extracted?.metadata?.metadata?.paragraphs);
      if (fields.length === 0) {
        return [];
      }
      const mainField = fields[0];
      return mainField.field.extracted.metadata.metadata.paragraphs.map((paragraph) => resource
        .getParagraphText(getFieldType(mainField.field_type), mainField.field_id, paragraph)
        .trim());
    }),
  );

  function highlightSelection() {
    const unmarkSelection = getUnMarked(selectedParagraph.text);
    if (unmarkSelection) {
      extractedTexts.subscribe(texts => {
        selectedIndex = texts.findIndex(text => text === unmarkSelection);
        if (selectedIndex > -1) {
          textViewerElement.querySelector(`#paragraph${selectedIndex}`)?.scrollIntoView({behavior: 'smooth'});
        }
      });
    }
  }
</script>

<div class="sw-text-viewer" bind:this={textViewerElement}>
  {#if $extractedTexts}
    {#each $extractedTexts as text, index}
      <p id="paragraph{index}" class:highlight={index === selectedIndex}>{text}</p>
    {/each}
  {/if}
</div>

<style
  lang="scss"
  src="./TextViewer.scss"></style>
