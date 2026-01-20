<script lang="ts">
  import {  Expander, Icon } from '../../common';
  import {
  getEntryAnswer,
    getEntryDetails,
    type AragChatEntry,
  } from '../../core';
  import { _ } from '../../core/i18n';
  import { MarkdownRendering } from '../viewer';

  interface Props {
    entry: AragChatEntry;
    expanded: boolean;
  }

  let { entry, expanded }: Props = $props();

  const answer = $derived(getEntryAnswer(entry));
  const details = $derived(getEntryDetails(entry));
</script>

<div
  class="sw-arag-answer">
  
    {#if answer}
      <div
        class="answer-text">
        <MarkdownRendering
          text={answer.answer || undefined}
          markers={true} />
      </div>
    {/if}
    {#if entry.error}
      <div class="answer-text error">
        <Icon name="warning" />
        {entry.error.detail}
      </div>
    {/if}
    {#if details.length > 0}
      <Expander {expanded}>
        {#snippet header()}
          <div class="title-xxs">
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
