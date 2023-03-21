<script lang="ts">
  import { _ } from '../../core/i18n';
  import Expander from '../../common/expander/Expander.svelte';
  import Feedback from './Feedback.svelte';
  import type { Chat } from '@nuclia/core';
  export let answer: Partial<Chat.Answer>;
  export let rank = 0;

  const sources = answer.sources?.resources ? Object.values(answer.sources?.resources) : [];
</script>

<div class="sw-answer">
  <div class="text">{answer.text}</div>
  {#if answer.sources}
    <div class="feedback">
      <Feedback {rank} />
    </div>
    <Expander>
      <h3
        class="title-xs"
        slot="header">
        {$_('answer.sources')}
      </h3>
      {#each sources as source}
        <div>{source.title}</div>
      {/each}
    </Expander>
  {/if}
</div>

<style
  lang="scss"
  src="./Answer.scss"></style>
