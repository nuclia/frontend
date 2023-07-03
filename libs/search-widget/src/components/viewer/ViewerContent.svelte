<script lang="ts">
  import { onDestroy } from 'svelte';
  import { filter } from 'rxjs';
  import { currentResultType, ResultType } from '../../core';
  import {
    AudioRenderer,
    ConversationRenderer,
    ImageRenderer,
    PdfRenderer,
    SpreadsheetRenderer,
    TextRenderer,
    VideoRenderer
  } from './renderers';

  let resultType: ResultType | null;
  const stateSubscription = currentResultType.pipe(filter(type => !!type)).subscribe((value) => resultType = value);

  onDestroy(() => {
    stateSubscription.unsubscribe();
  });
</script>

{#if resultType === 'audio'}
  <AudioRenderer />
{:else if resultType === 'conversation'}
  <ConversationRenderer />
{:else if resultType === 'image'}
  <ImageRenderer />
{:else if resultType === 'pdf'}
  <PdfRenderer />
{:else if resultType === 'spreadsheet'}
  <SpreadsheetRenderer />
{:else if resultType === 'text'}
  <TextRenderer />
{:else if resultType === 'video'}
  <VideoRenderer />
{/if}
