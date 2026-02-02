<script lang="ts">
  import { Expander, Icon } from '../../common';
  import {
    getEntryAnswer,
    getEntryAnswerText,
    getEntryDetails,
    getEntrySources,
    getEntryVisualizations,
    type AragChatEntry,
  } from '../../core';
  import { _ } from '../../core/i18n';
  import ResultRow from '../result-row/ResultRow.svelte';
  import AragSource from './AragSource.svelte';
  import { MarkdownRendering } from '../viewer';
  import VegaChart from './VegaChart.svelte';

  interface Props {
    entry: AragChatEntry;
    expanded: boolean;
    container: HTMLElement;
  }

  let { entry, expanded, container }: Props = $props();

  const answer = $derived(getEntryAnswer(entry));
  const visualizations = $derived(getEntryVisualizations(entry));
  const details = $derived(getEntryDetails(entry));
  const answerText = $derived(getEntryAnswerText(entry));
  const sources = $derived(getEntrySources(entry));

  let detailsElement: HTMLElement | undefined = $state(undefined);
  const expanderDuration = 300;

  $effect(() => {
    if (details && !answer) {
      setTimeout(() => {
        detailsElement?.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
      }, expanderDuration);
    }
    if (answer) {
      setTimeout(() => {
        container?.scrollIntoView({ behavior: 'smooth' });
      }, expanderDuration);
    }
  });
</script>

<div class="sw-arag-answer">
  {#if answer}
    <div class="answer-text">
      <MarkdownRendering
        text={answerText}
        markers={true} />
    </div>
  {/if}
  {#if visualizations}
    <div class="data-visualizations">
      {#each visualizations.data_visualizations as data}
        <VegaChart {data} />
      {/each}
    </div>
  {/if}
  {#if entry.error}
    <div class="answer-text error">
      <Icon name="warning" />
      {entry.error.detail}
    </div>
  {/if}
  {#if sources.length > 0}
    <div class="sources-container">
      <Expander
        expanded={false}
        duration={expanderDuration}>
        {#snippet header()}
          <div class="title-s">
            {$_('answer.sources')}
          </div>
        {/snippet}
        <div class="sources">
          {#each sources as source}
            <div class="source">
              <div class="ref">{source.rank}</div>
              <div class="source-text">
                {#if source.type === 'field'}
                  <ResultRow
                    result={source.value}
                    selected={undefined}
                    isSource={true}
                    answerRank={undefined} />
                {:else}
                  <AragSource {source} />
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </Expander>
    </div>
  {/if}
  {#if details.length > 0}
    <Expander
      {expanded}
      duration={expanderDuration}>
      {#snippet header()}
        <div class="title-s">
          {$_('answer.reasoning')}
        </div>
      {/snippet}
      <div bind:this={detailsElement}>
        {#each details as detail}
          <div class="reasoning-text">
            <h3>{detail.title}</h3>
            {#if detail.value}
              <MarkdownRendering text={detail.value} />
            {/if}
            {#if detail.message}
              <MarkdownRendering text={detail.message} />
            {/if}
          </div>
        {/each}
      </div>
    </Expander>
  {/if}
</div>

<style src="./AragAnswer.css"></style>
