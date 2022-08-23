<svelte:options tag="nuclia-search-results"/>

<script lang="ts">
  import type { Resource } from '@nuclia/core';
  import { nucliaState, nucliaStore } from './core/store';
  import { map, merge, Observable } from 'rxjs';
  import Results from './widgets/results/Results.svelte';


  let resource: Observable<Resource>;
  const results = nucliaState().results;
  const showResults = merge(
    nucliaStore().triggerSearch.pipe(map(() => true)),
  );

</script>

<div class="nuclia-widget nuclia-search-results" data-version="__NUCLIA_DEV_VERSION__">
  {#if $showResults}
    <Results results={$results} searchResultsWidget={true}/>
  {/if}
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;700&display=swap');
  @import "css-variables.css";
</style>
