<script lang="ts">
  import { onDestroy } from 'svelte';
  import { combineLatest, filter, interval, map, Observable, Subject, takeUntil } from 'rxjs';
  import { fieldFullId, fieldData } from '../../core/stores/viewer.store';
  import type { ConversationFieldData } from '@nuclia/core';
  import { FieldFullId, longToShortFieldType, Message, Paragraph, sliceUnicode } from '@nuclia/core';
  import type { Search } from '@nuclia/core';
  import { lightFormat } from 'date-fns';
  import { WidgetParagraph } from '../../core/models';
  import PlainTextRenderer from './renderer/PlainTextRenderer.svelte';
  import MarkdownRenderer from './renderer/MarkdownRenderer.svelte';
  import HtmlRenderer from './renderer/HtmlRenderer.svelte';
  import RstRenderer from './renderer/RstRenderer.svelte';

  export let selectedParagraph: WidgetParagraph | undefined;
  let viewerElement: HTMLElement;
  let stopHighlight = new Subject<void>();

  $: !!selectedParagraph && viewerElement && highlightSelection();

  type MessageWithParagraphs = Message & { paragraphIds: string[] };
  const messages: Observable<MessageWithParagraphs[]> = combineLatest([fieldFullId, fieldData]).pipe(
    filter(([fieldId, field]) => !!fieldId && !!field),
    map(([fieldId, field]) => [fieldId, field] as [string, ConversationFieldData]),
    map(([fieldId, field]) => {
      return field.value.messages.map((message) => ({
        ...message,
        paragraphIds:
          field.extracted?.metadata?.split_metadata?.[message.ident].paragraphs.map((paragraph) =>
            getParagraphId(fieldId, message.ident, paragraph),
          ) || [],
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
          viewerElement.querySelector(`#${formatValidId((selectedParagraph?.paragraph as Search.FindParagraph).id)}`),
        ),
        filter((paragraph) => !!paragraph),
      )
      .subscribe((paragraph) => {
        paragraph.scrollIntoView({ behavior: 'smooth' });
        stopHighlight.next();
      });
  }

  function formatValidId(id: string) {
    return `id_${id.split('/').join('_')}`;
  }

  function isMessageSelected(message: MessageWithParagraphs): boolean {
    return message.paragraphIds.some((id) => id === (selectedParagraph?.paragraph as Search.FindParagraph).id);
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
        <div class="text body-m html-content">
          {#if !message.content.format || message.content.format === 'PLAIN'}
            <PlainTextRenderer text={message.content.text} />
          {:else if message.content.format === 'MARKDOWN'}
            <MarkdownRenderer text={message.content.text} />
          {:else if message.content.format === 'HTML'}
            <HtmlRenderer text={message.content.text} />
          {:else if message.content.format === 'RST'}
            <RstRenderer text={message.content.text} />
          {/if}
        </div>
      </div>
    {/each}
  {/if}
</div>

<style
  lang="scss"
  src="./ConversationViewer.scss"></style>
