<script lang="ts">
  import { filter, map, Observable } from 'rxjs';
  import { fieldData } from '../../core/stores/viewer.store';
  import type { ConversationFieldData } from '@nuclia/core';
  import { Message, Paragraph, sliceUnicode } from '@nuclia/core';
  import { lightFormat } from 'date-fns';
  import { WidgetParagraph } from '../../core/models';

  export let selectedParagraph: WidgetParagraph | undefined;

  const messages: Observable<(Message & { paragraphs: Paragraph[] })[]> = fieldData.pipe(
    filter((field) => !!field),
    map((field) => field as ConversationFieldData),
    map((field) => {
      return field.value.messages.map((message) => ({
        ...message,
        paragraphs:
          field.extracted?.metadata?.split_metadata?.[message.ident].paragraphs.map((paragraph) =>
            sliceUnicode(field.extracted?.text.split_text?.[message.ident], paragraph.start, paragraph.end).trim(),
          ) || [],
      }));
    }),
  );
  const hasMetadata = messages.pipe(
    map((messages) => messages.some((message) => !!message.who || !!message.timestamp)),
  );
</script>

<div class="sw-conversation-viewer">
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
            <div>
              {paragraph}
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
