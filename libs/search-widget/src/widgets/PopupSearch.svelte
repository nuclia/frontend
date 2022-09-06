<script lang="ts">
  import Modal from '../components/modal/Modal.svelte';
  import { nucliaState } from '../core/store';
  import Results from './results/Results.svelte';
  import SearchInput from './search-input/SearchInput.svelte';
  import Suggestions from './suggestions/Suggestions.svelte';

  export let placeholder = '';

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
  const intents = nucliaState().labelIntents;
</script>

<div class="sw-popup-search">
  <div bind:this={inputElement}>
    <SearchInput on:typeahead={openSuggestions} on:search={openResults} popupSearch={true} {placeholder} />
  </div>
  <Modal
    show={showSuggestions && ($paragraphs.length > 0 || $hasSearchError)}
    on:close={() => (showSuggestions = false)}
    popup={true}
    parentPosition={position}
    {alignTo}
  >
    <div class="suggestions">
      <Suggestions paragraphs={$paragraphs} intents={$intents} />
    </div>
  </Modal>

  <Modal show={showModal} on:close={() => (showModal = false)} closeButton={true}>
    <div class="results">
      <Results results={$results} />
    </div>
  </Modal>
</div>
