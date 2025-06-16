<script lang="ts">
  import { filter } from 'rxjs';
  import { onDestroy } from 'svelte';
  import type { ResultType } from '../../core';
  import { currentResultType } from '../../core';
  import {
    AudioRenderer,
    ConversationRenderer,
    ImageRenderer,
    PdfRenderer,
    SpreadsheetRenderer,
    TextRenderer,
    VideoRenderer,
  } from './renderers';

  let { noResultNavigator } = $props();
  let resultType: ResultType | null = $state();
  const stateSubscription = currentResultType.pipe(filter((type) => !!type)).subscribe((value) => (resultType = value));

  onDestroy(() => {
    stateSubscription.unsubscribe();
  });
</script>

<div
  class="sw-viewer-content"
  class:no-result-navigator={noResultNavigator}>
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

<style src="./ViewerContent.css"></style>
