<script lang="ts">
  import { type TypedResult } from '../../core';
  import { ResultRow } from '../result-row';

  interface Props {
    sources?: TypedResult[];
    selected: number | undefined;
    answerRank: number | undefined;
  }

  let { sources = [], selected, answerRank }: Props = $props();
</script>

<div class="sw-sources">
  {#each sources as source}
    <div
      class="source">
      <div class="paragraph">
        {#if source.paragraphs?.[0] || (source.ranks && source.ranks.length > 0)}
          <ResultRow
            result={source}
            selected={selected !== undefined ? selected + 1 : undefined}
            isSource={true}
            {answerRank} />
        {/if}
      </div>
    </div>
  {/each}
</div>

<style src="./Sources.css"></style>
