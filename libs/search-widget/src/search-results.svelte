<svelte:options tag="nuclia-search-results"/>

<script lang="ts">
  import type { Resource } from '@nuclia/core';
  import { nucliaState } from './core/store';
  import { Observable } from 'rxjs';
  import Results from './widgets/results/Results.svelte';


  let resource: Observable<Resource>;
  const results = nucliaState().results;

</script>

<div class="nuclia-widget nuclia-search-results" data-version="__NUCLIA_DEV_VERSION__">
  <Results results={$results} searchResultsWidget={true}/>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;700&display=swap');
  @import "css-variables.css";
</style>
