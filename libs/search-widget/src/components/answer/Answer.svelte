<script lang="ts">
  import { _ } from '../../core/i18n';
  import Expander from '../../common/expander/Expander.svelte';
  import Feedback from './Feedback.svelte';
  import type { Chat, Search } from '@nuclia/core';
  export let answer: Partial<Chat.Answer>;
  export let rank = 0;

  const sources = answer.sources?.resources
    ? Object.values(answer.sources?.resources).map((res) => ({
        title: res.title,
        paragraphs: Object.values(res.fields)
          .reduce((acc, field) => {
            acc = acc.concat(Object.values(field.paragraphs));
            return acc;
          }, [] as Search.FindParagraph[])
          .sort((a, b) => b.score - a.score),
      }))
    : [];
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
        <div><strong>{source.title}</strong></div>
        <ul>
          {#each source.paragraphs as paragraph}
            <li>{paragraph.text}</li>
          {/each}
        </ul>
      {/each}
    </Expander>
  {/if}
</div>

<style
  lang="scss"
  src="./Answer.scss"></style>
