<script lang="ts">
  import { run } from 'svelte/legacy';

  import type { ConversationFieldData, FieldFullId, Message, Paragraph, Search } from '@nuclia/core';
  import { longToShortFieldType } from '@nuclia/core';
  import { lightFormat } from 'date-fns';
  import {
    combineLatest,
    distinctUntilChanged,
    filter,
    interval,
    map,
    Observable,
    Subject,
    switchMap,
    takeUntil,
    tap,
  } from 'rxjs';
  import { onDestroy } from 'svelte';
  import { Button } from '../../../common';
  import { _, fieldData, fieldFullId, loadMessagePage, selectedParagraph, totalMessagePages } from '../../../core';
  import { HtmlRendering, MarkdownRendering, PlainTextRendering, RstRendering } from './renderings';

  let viewerElement: HTMLElement = $state();
  let stopHighlight: Subject<void> = new Subject<void>();
  let selectedId: string | undefined;
  let page = $state(1);

  type MessageWithParagraphs = Message & { paragraphIds: string[] };
  const messages: Observable<MessageWithParagraphs[]> = combineLatest([fieldFullId, fieldData]).pipe(
    filter(([fieldId, field]) => !!fieldId && !!field && !!field.value),
    map(([fieldId, field]) => [fieldId, field] as [string, ConversationFieldData]),
    map(([fieldId, field]) => {
      return 'messages' in field.value
        ? field.value.messages.map((message) => ({
            ...message,
            paragraphIds:
              field.extracted?.metadata?.split_metadata?.[message.ident].paragraphs.map((paragraph) =>
                getParagraphId(fieldId, message.ident, paragraph),
              ) || [],
          }))
        : [];
    }),
  );
  const hasMetadata = messages.pipe(
    map((messages) => messages.some((message) => !!message.who || !!message.timestamp)),
  );

  function getParagraphId(fieldId: FieldFullId, splitId: string, paragraph: Paragraph) {
    return `${fieldId.resourceId}/${longToShortFieldType(fieldId.field_type)}/${fieldId.field_id}/${splitId}/${
      paragraph.start
    }-${paragraph.end}`;
  }

  function highlightSelection() {
    selectedParagraph
      .pipe(
        distinctUntilChanged(),
        tap((paragraph) => (selectedId = paragraph?.id)),
        filter((paragraph) => !!paragraph),
        map((paragraph) => paragraph as Search.FindParagraph),
        switchMap((paragraph) => {
          const selectedElementId = formatValidId(paragraph.id);
          return interval(200).pipe(
            map(() => viewerElement?.querySelector(`#${selectedElementId}`)),
            filter((paragraphElement) => !!paragraphElement),
            map((paragraphElement) => paragraphElement as HTMLElement),
            takeUntil(stopHighlight),
          );
        }),
      )
      .subscribe((paragraphElement) => {
        paragraphElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        stopHighlight.next();
      });
  }

  function formatValidId(id: string) {
    return `id_${(id || '').split('/').join('_')}`;
  }

  function isMessageSelected(message: MessageWithParagraphs): boolean {
    return message.paragraphIds.some((id) => id === selectedId);
  }

  onDestroy(() => {
    stopHighlight.next();
  });
  run(() => {
    !!viewerElement && highlightSelection();
  });
</script>

<div
  class="sw-conversation-renderer"
  bind:this={viewerElement}>
  {#if $messages}
    {#each $messages as message}
      <div
        class="message"
        id={formatValidId(message.paragraphIds[0] || '')}
        class:highlight={isMessageSelected(message)}>
        {#if $hasMetadata}
          <div class="metadata">
            {#if message.who}
              <div class="title-xxs">{message.who}</div>
            {/if}
            {#if message.timestamp}
              <div class="body-xs">
                {lightFormat(new Date(message.timestamp), 'yyyy-MM-dd HH:mm')}
              </div>
            {/if}
          </div>
        {/if}
        <div class="text body-m external-html-content">
          {#if !message.content.format || message.content.format === 'PLAIN'}
            <PlainTextRendering text={message.content.text} />
          {:else if ['MARKDOWN', 'KEEP_MARKDOWN'].includes(message.content.format)}
            <MarkdownRendering text={message.content.text} />
          {:else if message.content.format === 'HTML'}
            <HtmlRendering text={message.content.text} />
          {:else if message.content.format === 'RST'}
            <RstRendering text={message.content.text} />
          {/if}
        </div>
      </div>
    {/each}
    {#if $totalMessagePages > 0 && page < $totalMessagePages}
      <div class="show-more">
        <Button on:click={() => loadMessagePage(++page)}>
          {$_('viewer.show-more')}
        </Button>
      </div>
    {/if}
  {/if}
</div>

<style src="./ConversationRenderer.css"></style>
