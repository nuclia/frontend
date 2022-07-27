<script lang="ts">
  import type { WidgetParagraph, PdfWidgetParagraph, MediaWidgetParagraph } from '../../core/models';
  import { PreviewKind } from '../../core/models';
  import { formatTime } from '../../core/utils';
  import { viewerState, viewerStore, selectedParagraphIndex } from './../store';
  import ParagraphWithMenu from './ParagraphWithMenu.svelte';
  import ParagraphWithIcon from './ParagraphWithIcon.svelte';
  import { ParagraphIcon } from './ParagraphWithIcon.svelte';

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
            labels={paragraph.paragraph.classifications || []}
            active={$selectedParagraphIndex === i}
            on:click={() => previewParagraph(paragraph)}
          />
        {:else if paragraph.preview === PreviewKind.VIDEO || paragraph.preview === PreviewKind.AUDIO || paragraph.preview === PreviewKind.YOUTUBE}
          <ParagraphWithIcon
            text={paragraph.text}
            textIcon={formatTime(paragraph.time)}
            icon={ParagraphIcon.PLAY}
            labels={paragraph.paragraph.classifications || []}
            on:click={() => previewParagraph(paragraph)}
          />
        {:else}
          <ParagraphWithMenu labels={paragraph.paragraph.classifications || []}>
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
