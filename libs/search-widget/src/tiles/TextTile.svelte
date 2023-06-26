<script lang="ts">
  import type { FileField, IFieldData, Search, TextField } from '@nuclia/core';
  import type { WidgetParagraph } from '../core/models';
  import { PreviewKind } from '../core/models';
  import ExtractedTextViewer from './viewers/ExtractedTextViewer.svelte';
  import TextContentViewer from './viewers/TextContentViewer.svelte';
  import { getCDN } from '../core/utils';
  import DocumentTile from './base-tile/DocumentTile.svelte';
  import { fieldData } from '../core/stores/viewer.store';
  import { filter, map, Observable } from 'rxjs';

  export let result: Search.FieldResult;

  let selectedParagraph: WidgetParagraph | undefined;

  const filledFieldData: Observable<IFieldData> = fieldData.pipe(
    filter(data => !!data),
    map(data => data as IFieldData)
  );
  const isMarkdown = filledFieldData.pipe(
    map(
      (data) =>
        (data?.value as TextField)?.format === 'MARKDOWN' ||
        (data?.value as FileField).file?.content_type === 'text/markdown' ||
        ((data?.value as FileField).file?.content_type === 'application/octet-stream' &&
          (data?.value as FileField).file?.filename?.endsWith('.md')),
    ),
  );

  const isHtml = filledFieldData.pipe(
    map(
      (data) =>
        (data?.value as TextField)?.format === 'HTML' ||
        (data?.value as FileField).file?.content_type === 'text/html' ||
        ((data?.value as FileField).file?.content_type === 'application/octet-stream' &&
          (data?.value as FileField).file?.filename?.endsWith('.html')),
    ),
  );

  const isRst = filledFieldData.pipe(
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
    <TextContentViewer
      {selectedParagraph}
      isHtml={$isHtml} />
  {:else}
    <ExtractedTextViewer
      {selectedParagraph}
      isRst={$isRst} />
  {/if}
</DocumentTile>
