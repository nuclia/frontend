<script lang="ts">
  import type { WidgetParagraph, PdfWidgetParagraph, MediaWidgetParagraph } from '../../core/models';
  import { PreviewKind } from '../../core/models';
  import { formatTime } from '../../core/utils';
  import { viewerState, viewerStore, selectedParagraphIndex } from './../store';
  import Paragraph from './Paragraph.svelte';
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
            active={$selectedParagraphIndex === i}
            on:click={() => previewParagraph(paragraph)}
          />
        {:else if paragraph.preview === PreviewKind.VIDEO || paragraph.preview === PreviewKind.AUDIO}
          <ParagraphWithIcon
            text={paragraph.text}
            textIcon={formatTime(paragraph.time)}
            icon={ParagraphIcon.PLAY}
            on:click={() => previewParagraph(paragraph)}
          />
        {:else}
          <Paragraph>
            <span slot="content">{paragraph.text}</span>
          </Paragraph>
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
