<script lang="ts">
  import type { Answer } from '../../core/answer.models';
  import { _ } from '../../core/i18n';
  import Expander from '../../common/expander/Expander.svelte';
  export let answer: Partial<Answer>;
</script>

<div>
  <div>{answer.text}</div>
  {#if answer.sources}
    <Expander>
      <h3
        slot="header"
        class="title-xs">
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
