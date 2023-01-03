<script lang="ts">
  import type {
    WidgetParagraph,
    PdfWidgetParagraph,
    MediaWidgetParagraph,
    ParagraphLabels,
  } from '../../../core/models';
  import { PreviewKind } from '../../../core/models';
  import { formatTime, getParagraphId } from '../../../core/utils';
  import {
    viewerState,
    viewerStore,
    selectedParagraphIndex,
    paragraphLabels,
    setParagraphLabels,
  } from '../store/viewer.store';
  import ParagraphWithMenu from './ParagraphWithMenu.svelte';
  import ParagraphWithIcon from './ParagraphWithIcon.svelte';
  import { ParagraphIcon } from './ParagraphWithIcon.svelte';
  import ParagraphWithAnnotations from './ParagraphWithAnnotations.svelte';
  import { annotationMode } from '../../../core/stores/annotation.store';
  import { resource } from '../../../core/stores/resource.store';

  export let paragraphs: WidgetParagraph[] = [];

  const onlySelected = viewerState.onlySelected;
  const previewParagraph = (paragraph: PdfWidgetParagraph | MediaWidgetParagraph) => {
    viewerStore.showPreview.next(true);
    viewerStore.selectedParagraph.next({
      fieldType: paragraph.fieldType,
      fieldId: paragraph.fieldId,
      paragraph: paragraph.paragraph,
    });
  };
  const noLabels: ParagraphLabels = { labels: [], annotatedLabels: [] };
</script>

<div class="sw-paragraph-list">
  {#each paragraphs as paragraph, i}
    {#if !$onlySelected || ($onlySelected && i === $selectedParagraphIndex)}
      <div class="paragraph-item">
        {#if $annotationMode}
          <ParagraphWithAnnotations
            {paragraph}
            paragraphId={getParagraphId($resource.id, paragraph)} />
        {:else if paragraph.preview === PreviewKind.PDF}
          <ParagraphWithIcon
            text={paragraph.text}
            textIcon={'p. ' + (paragraph.page + 1)}
            icon={ParagraphIcon.EXPAND}
            active={$selectedParagraphIndex === i}
            on:click={() => previewParagraph(paragraph)}
            labels={$paragraphLabels[getParagraphId($resource.id, paragraph)] || noLabels}
            on:labelsChange={(event) => setParagraphLabels(event.detail, paragraph)} />
        {:else if paragraph.preview === PreviewKind.VIDEO || paragraph.preview === PreviewKind.AUDIO || paragraph.preview === PreviewKind.YOUTUBE}
          <ParagraphWithIcon
            text={paragraph.text}
            textIcon={formatTime(paragraph.start_seconds)}
            icon={ParagraphIcon.PLAY}
            on:click={() => previewParagraph(paragraph)}
            labels={$paragraphLabels[getParagraphId($resource.id, paragraph)] || noLabels}
            on:labelsChange={(event) => setParagraphLabels(event.detail, paragraph)} />
        {:else}
          <ParagraphWithMenu
            labels={$paragraphLabels[getParagraphId($resource.id, paragraph)] || noLabels}
            on:labelsChange={(event) => setParagraphLabels(event.detail, paragraph)}>
            <span slot="content">{@html paragraph.text}</span>
          </ParagraphWithMenu>
        {/if}
      </div>
    {/if}
  {/each}
</div>

<style
  lang="scss"
  src="./Paragraphs.scss"></style>
