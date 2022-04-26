<script lang="ts">
  import { nucliaState } from '../core/store';
  import Results from './results/Results.svelte';
  import SearchInput from './search-input/SearchInput.svelte';
  const results = nucliaState().results;
</script>

<div>
  <SearchInput />
  <div class="results" class:empty={$results.length === 0}>
    <Results results={$results} />
  </div>
</div>

<style>
</style>
