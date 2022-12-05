<script lang="ts">
  import { merge, map, pipe, tap } from 'rxjs';
  import Toggle from '../../common/toggle/Toggle.svelte';
  import { nucliaState, nucliaStore } from '../../core/old-stores/main.store';
  import Results from '../results/Results.svelte';
  import SearchInput from '../search-input/SearchInput.svelte';
  import { _ } from '../../core/i18n';

  export let placeholder = '';
  export let filter = false;

  const results = nucliaState().smartResults.pipe(tap((results) => console.log(results)));
  const showResults = merge(
    nucliaStore().triggerSearch.pipe(map(() => true)),
    nucliaState().smartResults.pipe(map((results) => results.length > 0)),
  );
  const hasQuery = nucliaState().query.pipe(map((query) => !!query));
  const onChange = (checked: boolean) =>
    nucliaStore().searchOptions.next({
      inTitleOnly: checked,
      highlight: true,
    });
</script>

<div class="sw-embedded-search">
  <div class="search-input-container">
    <SearchInput
      hasFilterButton={filter}
      embeddedSearch={true}
      {placeholder} />
  </div>

  <div class="options">
    <Toggle
      label={$_('form.title-only')}
      on:change={(e) => onChange(e.detail)} />
  </div>
  {#if $showResults && $hasQuery}
    <div
      class="results"
      class:empty={$results.length === 0}>
      <Results
        results={$results}
        formWidget={true} />
    </div>
  {/if}
</div>

<style
  lang="scss"
  src="./EmbeddedSearch.scss"></style>
