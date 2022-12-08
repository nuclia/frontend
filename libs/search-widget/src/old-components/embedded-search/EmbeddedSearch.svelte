<script lang="ts">
  import { merge, map, pipe, tap } from 'rxjs';
  import Toggle from '../../common/toggle/Toggle.svelte';
  import { nucliaState, nucliaStore } from '../../core/old-stores/main.store';
  import Results from '../results/Results.svelte';
  import SearchInput from '../search-input/SearchInput.svelte';
  import { _ } from '../../core/i18n';

  const results = nucliaState().smartResults;
  const showResults = merge(
    nucliaStore().triggerSearch.pipe(map(() => true)),
    nucliaState().smartResults.pipe(map((results) => results.length > 0)),
  );
  const isEmptyQuery = nucliaState().isEmptyQuery;
  const onChange = (checked: boolean) =>
    nucliaStore().searchOptions.next({
      inTitleOnly: checked,
      highlight: true,
    });
</script>

<div class="sw-embedded-search">
  <div class="search-input-container">
    <SearchInput embeddedSearch={true} />
  </div>

  <div class="options">
    <Toggle
      label={$_('form.title-only')}
      on:change={(e) => onChange(e.detail)} />
  </div>
  {#if $showResults && !$isEmptyQuery}
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
