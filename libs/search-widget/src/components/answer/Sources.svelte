<script lang="ts">
  import { type TypedResult, hideThumbnails } from '../../core';
  import { ResultRow } from '../result-row';

  export let sources: TypedResult[] = [];
  export let selected: number | undefined;
</script>

<div class="sw-sources">
  {#each sources as source, i}
    <div
      class="source"
      class:with-thumbnail={!$hideThumbnails}>
      <div class="paragraph">
        {#if source.paragraphs?.[0]}
          <ResultRow
            result={source}
            selected={selected + 1}
            isSource={true} />
        {/if}
      </div>
    </div>
  {/each}
</div>

<style
  lang="scss"
  src="./Sources.scss"></style>
