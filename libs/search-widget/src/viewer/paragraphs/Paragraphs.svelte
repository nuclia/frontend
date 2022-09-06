<script lang="ts">
  import type { Resource } from '@nuclia/core';
  import type { WidgetParagraph, PdfWidgetParagraph, MediaWidgetParagraph } from '../../core/models';
  import { PreviewKind } from '../../core/models';
  import { formatTime } from '../../core/utils';
  import { setLabels } from '../../core/api';
  import { viewerState, viewerStore, selectedParagraphIndex, paragraphLabels, getParagraphId } from './../store';
  import ParagraphWithMenu from './ParagraphWithMenu.svelte';
  import ParagraphWithIcon from './ParagraphWithIcon.svelte';
  import { ParagraphIcon } from './ParagraphWithIcon.svelte';
  import { filter, concatMap, take, combineLatest } from 'rxjs';

  export let paragraphs: WidgetParagraph[] = [];
  const onlySelected = viewerState.onlySelected;
  const savingLabels = viewerStore.savingLabels;
  const resource = viewerStore.resource.pipe(filter((resource): resource is Resource => !!resource));
  const previewParagraph = (paragraph: PdfWidgetParagraph | MediaWidgetParagraph) => {
    viewerStore.showPreview.next(true);
    viewerStore.selectedParagraph.next({
      fieldType: paragraph.fieldType,
      fieldId: paragraph.fieldId,
      paragraph: paragraph.paragraph,
    });
  };
  const modifyLabels = (event: any, paragraph: WidgetParagraph) => {
  resource
    .pipe(
      take(1),
      concatMap((resource) => {
        savingLabels.next(true);
        const paragraphId = getParagraphId(resource.id, paragraph);
        return setLabels(resource, paragraph.fieldType.slice(0, -1), paragraph.fieldId, paragraphId, event.detail);
      }),
      concatMap(() => combineLatest([resource, paragraphLabels]).pipe(take(1)))
    )
    .subscribe(([resource, paragraphLabels]) => {
      const newLabels = {...paragraphLabels, [getParagraphId(resource.id, paragraph)]: event.detail };
      viewerStore.updatedLabels.next(newLabels);
      savingLabels.next(false);
    });
  };
</script>

<div class="paragraph-list">
  {#each paragraphs as paragraph, i}
    {#if !$onlySelected || ($onlySelected && i === $selectedParagraphIndex)}
      <div class="paragraph-item">
        {#if paragraph.preview === PreviewKind.PDF}
          <ParagraphWithIcon
            text={paragraph.text}
            textIcon={'p. ' + (paragraph.page + 1)}
            icon={ParagraphIcon.EXPAND}
            active={$selectedParagraphIndex === i}
            on:click={() => previewParagraph(paragraph)}
            labels={$paragraphLabels[getParagraphId($resource.id, paragraph)] || []}
            on:labelsChange={(event) => modifyLabels(event, paragraph)}
          />
        {:else if paragraph.preview === PreviewKind.VIDEO || paragraph.preview === PreviewKind.AUDIO || paragraph.preview === PreviewKind.YOUTUBE}
          <ParagraphWithIcon
            text={paragraph.text}
            textIcon={formatTime(paragraph.start)}
            icon={ParagraphIcon.PLAY}
            on:click={() => previewParagraph(paragraph)}
            labels={$paragraphLabels[getParagraphId($resource.id, paragraph)] || []}
            on:labelsChange={(event) => modifyLabels(event, paragraph)}
          />
        {:else}
          <ParagraphWithMenu
            labels={$paragraphLabels[getParagraphId($resource.id, paragraph)] || []}
            on:labelsChange={(event) => modifyLabels(event, paragraph)}
          >
            <span slot="content">{paragraph.text}</span>
          </ParagraphWithMenu>
        {/if}
      </div>
    {/if}
  {/each}
</div>

<style>
  .paragraph-item {
    margin-bottom: 20px;
  }
</style>
