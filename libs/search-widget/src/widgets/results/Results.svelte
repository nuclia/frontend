<script lang="ts">
  import { nucliaState } from '../../core/store';
  import Row from '../row/Row.svelte';
  import type { IResource } from '@nuclia/core';
  import { _ } from '../../core/i18n';
  import Spinner from '../../components/spinner/Spinner.svelte';

  export let results: IResource[] = [];

  const hasSearchError = nucliaState().hasSearchError;
  const pendingResults = nucliaState().pendingResults;
</script>

<div>
  {#if $hasSearchError}
    <div class="error"><strong>{$_('error.search')}</strong> <span>{$_('error.search-beta')}</span></div>
  {:else if $pendingResults}
    <h3 class="empty"><Spinner /></h3>
  {:else if results.length === 0}
    <h3 class="empty">{$_('results.empty')}</h3>
  {/if}
  {#each results as result}
    <Row {result} />
  {/each}
</div>

<style>
  h3,
  .error {
    padding: 1em;
    background-color: var(--color-light-stronger);
  }
  div,
  h3.empty {
    height: 100%;
  }
</style>
