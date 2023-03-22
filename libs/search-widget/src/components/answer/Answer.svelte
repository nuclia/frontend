<script lang="ts">
  import { _ } from '../../core/i18n';
  import Expander from '../../common/expander/Expander.svelte';
  import Feedback from './Feedback.svelte';
  import type { Chat, Search } from '@nuclia/core';
  import { getSortedResults } from '../../core/stores/search.store';
  import Tile from '../../tiles/Tile.svelte';
  export let answer: Partial<Chat.Answer>;
  export let rank = 0;

  const sources = getSortedResults(answer.sources?.resources);
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
      <div class="results">
        {#each sources as result}
          <Tile {result} />
        {/each}
      </div>
    </Expander>
  {/if}
</div>

<style
  lang="scss"
  src="./Answer.scss"></style>
