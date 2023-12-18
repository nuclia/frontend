<script lang="ts">
  import { _ } from '../../core/i18n';
  import Expander from '../../common/expander/Expander.svelte';
  import Feedback from './Feedback.svelte';
  import type { Chat, Citations, Search } from '@nuclia/core';
  import { getSortedResults } from '../../core/stores/search.store';
  import { createEventDispatcher } from 'svelte';
  import { isMobileViewport } from '../../common/utils';
  import ResultRow from '../result-row/ResultRow.svelte';
  import { hideSources } from '../../core/stores/widget.store';
  import { resource, type TypedResult } from '../../core';
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

  const sources = answer.sources?.resources
    ? getSortedResults(removeNotCitedContent(Object.values(answer.sources?.resources), answer.citations))
    : [];

  function removeNotCitedContent(resources: Search.FindResource[], citations?: Citations) {
    if (!citations || Object.keys(citations).length === 0) {
      return resources;
    }
    const citedParagraphs = Object.keys(citations);
    const citedResources = citedParagraphs.reduce((acc, paragraphId) => {
      const resId = paragraphId.split('/')[0];
      if (!acc.includes(resId)) {
        acc.push(resId);
      }
      return acc;
    }, [] as string[]);

    return (
      resources
        // Remove resources that are not cited
        .filter((resource) => citedResources.includes(resource.id))
        // Remove paragraphs that are not cited
        .map((resource) => ({
          ...resource,
          fields: Object.entries(resource.fields).reduce(
            (allFields, [fieldId, field]) => {
              allFields[fieldId] = {
                ...field,
                paragraphs: Object.entries(field.paragraphs).reduce(
                  (allParagraphs, [paragraphId, paragraph]) => {
                    if (citedParagraphs.includes(paragraphId)) {
                      allParagraphs[paragraphId] = paragraph;
                    }
                    return allParagraphs;
                  },
                  {} as {
                    [id: string]: Search.FindParagraph;
                  },
                ),
              };
              return allFields;
            },
            {} as {
              [id: string]: Search.FindField;
            },
          ),
        }))
    );
  }
</script>

<svelte:window bind:innerWidth />
<div class="sw-answer">
  <div class="answer-container">
    <div
      class="text"
      class:error={answer.inError}>
      {@html text}
    </div>
    {#if !isMobile && !hideFeedback}
      <Feedback {rank} />
    {/if}
  </div>
  {#if answer.sources && !notEnoughData}
    <div class="feedback">
      <Feedback {rank} />
    </div>
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
