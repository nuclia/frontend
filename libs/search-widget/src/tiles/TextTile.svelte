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
  import { tap } from 'rxjs/operators';

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

  const isHtml = fieldData.pipe(
    map(
      (data) =>
        (data?.value as TextField)?.format === 'HTML' ||
        (data?.value as FileField).file?.content_type === 'text/html' ||
        ((data?.value as FileField).file?.content_type === 'application/octet-stream' &&
          (data?.value as FileField).file?.filename?.endsWith('.html')),
    ),
  );

  const isRst = fieldData.pipe(
    map(
      (data) =>
        (data?.value as TextField)?.format === 'RST' ||
        (data?.value as FileField).file?.content_type === 'text/x-rst' ||
        ((data?.value as FileField).file?.content_type === 'application/octet-stream' &&
          (data?.value as FileField).file?.filename?.endsWith('.rst')),
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
  {#if $isMarkdown || $isHtml}
    <MarkdownViewer
      {selectedParagraph}
      isHtml={$isHtml} />
  {:else}
    <TextViewer
      {selectedParagraph}
      isRst={$isRst} />
  {/if}
</DocumentTile>
