<script lang="ts">
  import { merge, map } from 'rxjs';
  import Toggle from '../../common/toggle/Toggle.svelte';
  import Results from '../results/Results.svelte';
  import SearchInput from '../search-input/SearchInput.svelte';
  import { _ } from '../../core/i18n';
  import { isEmptySearchQuery, searchOptions, smartResults, triggerSearch } from '../../core/stores/search.store';

  const results = smartResults;
  const showResults = merge(
    triggerSearch.pipe(map(() => true)),
    smartResults.pipe(map((results) => results.length > 0)),
  );
  const onChange = (checked: boolean) =>
    searchOptions.set({
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
  {#if $showResults && !$isEmptySearchQuery}
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
