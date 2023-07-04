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

<div class="sw-viewer-content">
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
</div>

<!-- --renderer-outer-space is a variable used in our different renderers to calculate the renderer’s max-height -->
<!-- it is usually used as follow: `max-height: calc(100vh - var(--renderer-outer-space));` -->
<!-- this way, the renderers can still be used by themselves (= as components outside the viewer)
 and the end user can set their own `--renderer-outer-space` variable -->
<style>
  .sw-viewer-content {
    --renderer-outer-space: var(--header-height) - var(--side-padding) * 2;
  }
</style>
