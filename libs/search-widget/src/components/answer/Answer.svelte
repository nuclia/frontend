<script lang="ts">
  import { _ } from '../../core/i18n';
  import Feedback from './Feedback.svelte';
  import type { Chat, Citations, FieldId, Search } from '@nuclia/core';
  import { FIELD_TYPE, SHORT_FIELD_TYPE, shortToLongFieldType } from '@nuclia/core';
  import { createEventDispatcher } from 'svelte';
  import { Button, Expander } from '../../common';
  import Sources from './Sources.svelte';
  import {
    chat,
    getFieldDataFromResource,
    getResultType,
    hasNotEnoughData,
    isCitationsEnabled,
    notEnoughDataMessage,
    type TypedResult
  } from '../../core';

  export let answer: Partial<Chat.Answer>;
  export let rank = 0;
  export let initialAnswer = false;
  let text = '';

  const dispatch = createEventDispatcher();
  const NEWLINE = new RegExp(/\n/g);
  $: text = answer.text?.replace(NEWLINE, '<br>') || '';
  $: notEnoughData = hasNotEnoughData(answer.text || '');

  $: sources =
    answer.citations && answer.sources?.resources ? getSourcesResults(answer.sources?.resources, answer.citations) : [];

  function getSourcesResults(resources: { [key: string]: Search.FindResource }, citations: Citations): TypedResult[] {
    return Object.keys(citations)
      .map((paragraphId) => {
        const [resourceId, shortFieldType, fieldId] = paragraphId.split('/');
        const resource = resources[resourceId];
        const paragraph = resources[resourceId]?.fields?.[`/${shortFieldType}/${fieldId}`]?.paragraphs?.[paragraphId];
        if (resource && paragraph) {
          const field: FieldId = {
            field_type: shortToLongFieldType(shortFieldType as SHORT_FIELD_TYPE) || FIELD_TYPE.generic,
            field_id: fieldId,
          };
          const fieldData = getFieldDataFromResource(resource, field);
          const { resultType, resultIcon } = getResultType({ ...resource, field, fieldData });
          return { ...resource, resultType, resultIcon, field, fieldData, paragraphs: [paragraph] };
        }
        return undefined;
      })
      .filter((source) => !!source)
      .map((source) => source as TypedResult);
  }
</script>

<div class="sw-answer">
  <div
    class="answer-text"
    class:error={answer.inError}>
    {#if (notEnoughData && $notEnoughDataMessage)}
      {@html $notEnoughDataMessage}
    {:else}
      {@html text}
    {/if}

  </div>
  {#if answer.sources && !notEnoughData}
    <div class="actions">
      <div>
        <Feedback {rank} />
      </div>
      {#if initialAnswer && !$chat[rank]?.answer.incomplete}
        <Button
          aspect="basic"
          size="small"
          on:click={() => dispatch('openChat')}>
          <span class="go-to-chat title-s">{$_('answer.chat-action')}</span>
        </Button>
      {/if}
    </div>
    {#if $isCitationsEnabled}
      <div class="sources-container">
        {#if sources.length > 0}
          {#if initialAnswer}
            <div class="title-s">{$_('answer.sources')}</div>
            <div class="sources-list">
              <Sources {sources} />
            </div>
          {:else}
            <Expander>
              <div
                class="title-s"
                slot="header">
                {$_('answer.sources')}
              </div>
              <div class="sources-list">
                <Sources {sources} />
              </div>
            </Expander>
          {/if}
        {:else if !answer.incomplete}
          <div class="title-s">{$_('answer.sources')}</div>
          <div class="no-citations">{$_('answer.no-citations')}</div>
        {/if}
      </div>
    {/if}
  {/if}
</div>

<style
  lang="scss"
  src="./Answer.scss"></style>
