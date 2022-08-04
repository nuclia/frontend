<script lang="ts">
  import { merge, mapTo, map } from 'rxjs';
  import Toggle from '../components/toggle/toggle.svelte';
  import { nucliaState, nucliaStore } from '../core/store';
  import Results from './results/Results.svelte';
  import SearchInput from './search-input/SearchInput.svelte';
  import { _ } from '../core/i18n';

  const results = nucliaState().results;
  const showResults = merge(
    nucliaStore().triggerSearch.pipe(mapTo(true)),
    nucliaState().results.pipe(map((results) => results.length > 0)),
  );
  const onChange = (checked: boolean) =>
    nucliaStore().searchOptions.next({
      inTitleOnly: checked,
      highlight: true,
    });
</script>

<div>
  <div class="search-input-container">
    <SearchInput formWidget={true} />
  </div>
  <div class="options">
    <Toggle label={$_('form.title-only')} on:change={(e) => onChange(e.detail)} />
  </div>
  {#if $showResults}
    <div class="results" class:empty={$results.length === 0}>
      <Results results={$results} formWidget={true}/>
    </div>
  {/if}
</div>

<style>
  .search-input-container {
    display: flex;
    justify-content: center;
  }
  .options {
    padding: 0.5rem 0;
    display: none;
  }
</style>
