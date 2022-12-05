<script lang="ts">
  import { nucliaState } from '../../core/old-stores/main.store';
  import Row from '../row/Row.svelte';
  import type { Search } from '@nuclia/core';
  import { _ } from '../../core/i18n';
  import LoadingDots from '../../common/spinner/LoadingDots.svelte';

  export let displayThumbnail = true;
  export let formWidget = false;
  export let results: Search.SmartResult[] = [];

  const hasSearchError = nucliaState().hasSearchError;
  const pendingResults = nucliaState().pendingResults;
  let showAll = false;
</script>

<div class="sw-results">
  {#if $hasSearchError}
    <div class="error">
      <strong>{$_('error.search')}</strong>
      <span>{$_('error.search-beta')}</span>
    </div>
  {:else if $pendingResults}
    <h3 class="empty">
      <LoadingDots />
    </h3>
  {:else if results.length === 0}
    <h3 class="empty">{$_('results.empty')}</h3>
  {:else}
    <div class="results">
      <div>
        {#each results as result}
          <div class="result">
            <Row
              {displayThumbnail}
              {result}
              {formWidget} />
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style
  lang="scss"
  src="./Results.scss"></style>
