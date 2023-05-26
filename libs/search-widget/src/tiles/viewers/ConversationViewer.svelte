<script lang="ts">
  import { onDestroy } from 'svelte';
  import { combineLatest, filter, interval, map, Observable, Subject, takeUntil } from 'rxjs';
  import { fieldFullId, fieldData } from '../../core/stores/viewer.store';
  import type { ConversationFieldData } from '@nuclia/core';
  import { FieldFullId, longToShortFieldType, Message, Paragraph, sliceUnicode } from '@nuclia/core';
  import type { Search } from '@nuclia/core';
  import { lightFormat } from 'date-fns';
  import { WidgetParagraph } from '../../core/models';

  export let selectedParagraph: WidgetParagraph | undefined;
  let viewerElement: HTMLElement;
  let stopHighlight = new Subject<void>();

  $: !!selectedParagraph && viewerElement && highlightSelection();

  const messages: Observable<(Message & { paragraphs: { id: string; paragraphs: Paragraph[] } })[]> = combineLatest([
    fieldFullId,
    fieldData,
  ]).pipe(
    filter(([fieldId, field]) => !!fieldId && !!field),
    map(([fieldId, field]) => [fieldId, field] as [string, ConversationFieldData]),
    map(([fieldId, field]) => {
      return field.value.messages.map((message) => ({
        ...message,
        paragraphs:
          field.extracted?.metadata?.split_metadata?.[message.ident].paragraphs.map((paragraph) => ({
            id: getParagraphId(fieldId, message.ident, paragraph),
            text: sliceUnicode(field.extracted?.text.split_text?.[message.ident], paragraph.start, paragraph.end),
          })) || [],
      }));
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
    stopHighlight.next();
    interval(200)
      .pipe(
        takeUntil(stopHighlight),
        map(() =>
          viewerElement.querySelector(
            `#${(selectedParagraph?.paragraph as Search.FindParagraph).id.split('/').join('_')}`,
          ),
        ),
        filter((paragraph) => !!paragraph),
      )
      .subscribe((paragraph) => {
        paragraph.scrollIntoView({ behavior: 'smooth' });
        stopHighlight.next();
      });
  }

  onDestroy(() => {
    stopHighlight.next();
  });
</script>

<div
  class="sw-conversation-viewer"
  bind:this={viewerElement}>
  {#if $messages}
    {#each $messages as message}
      <div class="message">
        {#if $hasMetadata}
          <div class="metadata">
            {#if message.who}
              <div class="title-xxs">{message.who}</div>
            {/if}
            {#if message.timestamp}
              <div class="date">
                <span>{lightFormat(new Date(message.timestamp), 'yyyy/MM/dd')}</span>
                <span>{lightFormat(new Date(message.timestamp), 'HH:mm')}</span>
              </div>
            {/if}
          </div>
        {/if}
        <div class="text body-m">
          {#each message.paragraphs as paragraph}
            <div
              id={paragraph.id.split('/').join('_')}
              class:highlight={paragraph.id === selectedParagraph?.paragraph.id}>
              {paragraph.text}
            </div>
          {/each}
        </div>
      </div>
    {/each}
  {/if}
</div>

<style
  lang="scss"
  src="./ConversationViewer.scss"></style>
