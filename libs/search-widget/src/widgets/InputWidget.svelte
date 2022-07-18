<script lang="ts">
  import Modal from '../components/modal/Modal.svelte';
  import { nucliaState } from '../core/store';
  import Results from './results/Results.svelte';
  import SearchInput from './search-input/SearchInput.svelte';
  import Suggestions from './suggestions/Suggestions.svelte';
  import { _ } from '../core/i18n';

  let showModal = false;
  let showSuggestions = false;
  let inputElement;
  let position;
  let alignTo = 'left';

  const openSuggestions = () => {
    position = inputElement?.getBoundingClientRect();
    showSuggestions = true;
  };
  const openResults = () => {
    showSuggestions = false;
    showModal = true;
  };
  const results = nucliaState().results;
  const paragraphs = nucliaState().paragraphs;
  const hasSearchError = nucliaState().hasSearchError;
</script>

<div bind:this={inputElement}>
  <SearchInput on:typeahead={openSuggestions} on:search={openResults} inputWidget={true} />
</div>
<Modal
  show={showSuggestions && ($paragraphs.length > 0 || $hasSearchError)}
  on:close={() => (showSuggestions = false)}
  popup={true}
  parentPosition={position}
  {alignTo}
>
  <div class="suggestions">
    <Suggestions paragraphs={$paragraphs} />
  </div>
</Modal>

<Modal show={showModal} on:close={() => (showModal = false)} closeButton={true}>
  <div class="results">
    <Results results={$results} />
  </div>
</Modal>

<style>
  .suggestions {
    padding: 16px;
  }
  .results {
    max-width: 100vw;
    width: calc(100vw - 10px);
    height: calc(100vh - 60px);
  }
  @media (min-width: 640px) {
    .results {
      width: calc(100vw - 100px);
      height: calc(90vh - 139px);
    }
  }
</style>
