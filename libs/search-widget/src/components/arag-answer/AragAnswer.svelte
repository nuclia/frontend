<script lang="ts">
  import { Expander, Icon } from '../../common';
  import { getEntryAnswer, getEntryAnswerText, getEntryDetails, getEntrySources, type AragChatEntry } from '../../core';
  import { _ } from '../../core/i18n';
  import ResultRow from '../result-row/ResultRow.svelte';
  import AragSource from './AragSource.svelte';
  import { MarkdownRendering } from '../viewer';

  interface Props {
    entry: AragChatEntry;
    expanded: boolean;
  }

  let { entry, expanded }: Props = $props();

  const answer = $derived(getEntryAnswer(entry));
  const details = $derived(getEntryDetails(entry));
  const answerText = $derived(getEntryAnswerText(entry));
  const sources = $derived(getEntrySources(entry));
</script>

<div class="sw-arag-answer">
  {#if answer}
    <div class="answer-text">
      <MarkdownRendering
        text={answerText}
        markers={true} />
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
      <Expander expanded={false}>
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
    <Expander {expanded}>
      {#snippet header()}
        <div class="title-s">
          {$_('answer.reasoning')}
        </div>
      {/snippet}
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
    </Expander>
  {/if}
</div>

<style src="./AragAnswer.css"></style>
