<script lang="ts">
  import { _ } from '../../core/i18n';
  import Expander from '../../common/expander/Expander.svelte';
  import Feedback from './Feedback.svelte';
  import type { Chat } from '@nuclia/core';
  import { getSortedResults } from '../../core/stores/search.store';
  import { createEventDispatcher } from 'svelte';
  import { isMobileViewport } from '../../common/utils';
  import ResultRow from '../result-row/ResultRow.svelte';
  import { hideSources } from '../../core/stores/widget.store';
  import { MarkdownRendering } from '../viewer/renderers/renderings';

  export let answer: Partial<Chat.Answer>;
  export let rank = 0;
  export let hideFeedback = false;
  let text = '';
  let innerWidth = window.innerWidth;

  const dispatch = createEventDispatcher();
  const NEWLINE = new RegExp(/\n/g);
  $: text = answer.text?.replace(NEWLINE, '<br>') || '';
  $: notEnoughData = text === 'Not enough data to answer this.';
  $: isMobile = isMobileViewport(innerWidth);

  const sources = getSortedResults(Object.values(answer.sources?.resources));
</script>

<svelte:window bind:innerWidth />
<div class="sw-answer">
  <div class="answer-container">
    <div class="text"><MarkdownRendering {text} /></div>
    {#if !isMobile && !hideFeedback}
      <Feedback {rank} />
    {/if}
  </div>
  {#if answer.sources && !notEnoughData}
    {#if !$hideSources}
      <Expander on:toggleExpander>
        <h3
          class="title-xs"
          slot="header">
          {isMobile ? $_('answer.sources-mobile') : $_('answer.sources')}
        </h3>
        <div class="results">
          {#each sources as result}
            <ResultRow {result} />
          {/each}
        </div>
      </Expander>
    {/if}
  {/if}
</div>

<style
  lang="scss"
  src="./Answer.scss"></style>
