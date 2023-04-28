<script lang="ts">
  import type { FileField, Search, TextField } from '@nuclia/core';
  import type { WidgetParagraph } from '../core/models';
  import { PreviewKind } from '../core/models';
  import TextViewer from './viewers/TextViewer.svelte';
  import MarkdownViewer from './viewers/MarkdownViewer.svelte';
  import { getCDN } from '../core/utils';
  import DocumentTile from './base-tile/DocumentTile.svelte';
  import { fieldData } from '../core/stores/viewer.store';
  import { map } from 'rxjs';

  export let result: Search.SmartResult;

  let selectedParagraph: WidgetParagraph | undefined;

  const isMarkdown = fieldData.pipe(
    map(
      (data) =>
        (data?.value as TextField)?.format === 'MARKDOWN' ||
        (data?.value as FileField).file?.content_type === 'text/markdown' ||
        ((data?.value as FileField).file?.content_type === 'application/octet-stream' &&
          (data?.value as FileField).file?.filename?.endsWith('.md')),
    ),
  );

  function openParagraph(paragraph: WidgetParagraph) {
    selectedParagraph = paragraph;
  }
</script>

<DocumentTile
  previewKind={PreviewKind.NONE}
  fallbackThumbnail={`${getCDN()}icons/text/plain.svg`}
  {result}
  on:selectParagraph={(event) => openParagraph(event.detail)}>
  {#if $isMarkdown}
    <MarkdownViewer {selectedParagraph} />
  {:else}
    <TextViewer {selectedParagraph} />
  {/if}
</DocumentTile>
