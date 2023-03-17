<script lang="ts">
  import type { Answer } from '../../core/answer.models';
  import { _ } from '../../core/i18n';
  import Expander from '../../common/expander/Expander.svelte';
  import Feedback from './Feedback.svelte';
  export let answer: Partial<Answer>;
  export let rank = 0;
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
      {#each answer.sources as source}
        <div>{source.paragraph}</div>
      {/each}
    </Expander>
  {/if}
</div>

<style
  lang="scss"
  src="./Answer.scss"></style>
