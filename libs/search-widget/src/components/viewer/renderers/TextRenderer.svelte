<script lang="ts">
  import type { Observable } from 'rxjs';
  import { filter, map, switchMap } from 'rxjs';
  import { FIELD_TYPE, type FileField, type IFieldData, type TextField } from '@nuclia/core';
  import { fieldData, fieldFullId, selectedParagraph } from '../../../core';
  import { ExtractedTextRendering, TextContentRendering } from './renderings';

  const isLink = fieldFullId.pipe(map((fullId) => fullId && fullId.field_type === FIELD_TYPE.link));
  const filledFieldData: Observable<IFieldData> = fieldData.pipe(
    filter((data) => !!data),
    map((data) => data as IFieldData),
  );
  const isMarkdown = filledFieldData.pipe(
    switchMap((data) =>
      isLink.pipe(
        map(
          (isLink) =>
            isLink ||
            (data?.value as TextField)?.format === 'MARKDOWN' ||
            (data?.value as TextField)?.format === 'KEEP_MARKDOWN' ||
            (data?.value as FileField).file?.content_type === 'text/markdown' ||
            ((data?.value as FileField).file?.content_type === 'application/octet-stream' &&
              (data?.value as FileField).file?.filename?.endsWith('.md')),
        ),
      ),
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
</script>

<div class="sw-text-renderer external-html-content">
  {#if $isMarkdown || $isHtml}
    <TextContentRendering
      selectedParagraph={$selectedParagraph}
      isHtml={$isHtml} />
  {:else}
    <ExtractedTextRendering
      selectedParagraph={$selectedParagraph}
      isRst={$isRst} />
  {/if}
</div>

<style>
  .sw-text-renderer {
    height: calc(100vh - var(--renderer-outer-space));
    overflow: auto;
    position: relative;
  }
</style>
