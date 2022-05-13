<script lang="ts">
  import { mapTo } from 'rxjs';
  import { nucliaState, nucliaStore } from '../core/store';
  import Results from './results/Results.svelte';
  import SearchInput from './search-input/SearchInput.svelte';
  const results = nucliaState().results;
  const showResults = nucliaStore().triggerSearch.pipe(mapTo(true));
</script>

<div>
  <SearchInput formWidget={true} />
  {#if $showResults}
    <div class="results" class:empty={$results.length === 0}>
      <Results results={$results} />
    </div>
  {/if}
</div>

<style>
</style>
