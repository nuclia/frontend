<script lang="ts">
  import { merge, map } from 'rxjs';
  import Toggle from '../components/toggle/toggle.svelte';
  import { nucliaState, nucliaStore } from '../core/store';
  import Results from './results/Results.svelte';
  import SearchInput from './search-input/SearchInput.svelte';
  import { _ } from '../core/i18n';
  import Modal from '../components/modal/Modal.svelte';
  import Suggestions from './suggestions/Suggestions.svelte';

  export let placeholder = '';

  const results = nucliaState().results;
  const showResults = merge(
    nucliaStore().triggerSearch.pipe(map(() => true)),
    nucliaState().results.pipe(map((results) => results.length > 0)),
  );
  const onChange = (checked: boolean) =>
    nucliaStore().searchOptions.next({
      inTitleOnly: checked,
      highlight: true,
    });

  const paragraphs = nucliaState().paragraphs;
  const intents = nucliaState().labelIntents;
  const hasSearchError = nucliaState().hasSearchError;
  let inputElement: HTMLElement | undefined;
  let position: DOMRect | undefined;
  let showSuggestions = false;

  const openSuggestions = () => {
    showSuggestions = true;
    position = inputElement?.getBoundingClientRect();
  };
  const closeSuggestions = () => {
    showSuggestions = false;
  };
</script>

<div>
  <div class="search-input-container">
    <div bind:this={inputElement}>
      <SearchInput embeddedSearch={true}
                   placeholder="{placeholder}"
                   on:typeahead={openSuggestions}
                   on:search={closeSuggestions}
      />
    </div>
  </div>
  <Modal
    show={showSuggestions && ($paragraphs.length > 0 || $hasSearchError)}
    on:close={closeSuggestions}
    popup={true}
    parentPosition={position}
  >
    <div class="suggestions">
      <Suggestions paragraphs={$paragraphs} intents={$intents}/>
    </div>
  </Modal>
  <div class="options">
    <Toggle label={$_('form.title-only')} on:change={(e) => onChange(e.detail)}/>
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
    padding: var(--rhythm-1) 0;
    display: none;
  }

  .suggestions {
    padding: var(--rhythm-2);
  }
</style>
