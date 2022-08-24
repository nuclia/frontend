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

<div bind:this={inputElement}>
  <SearchInput on:typeahead={openSuggestions}
               on:search={openResults}
               popupSearch={true}
               placeholder="{placeholder}"/>
</div>
<Modal show={showSuggestions && ($paragraphs.length > 0 || $hasSearchError)}
       on:close={() => (showSuggestions = false)}
       popup={true}
       parentPosition={position}
       {alignTo}
>
  <div class="suggestions">
    <Suggestions paragraphs={$paragraphs} intents={$intents}/>
  </div>
</Modal>

<Modal show={showModal} on:close={() => (showModal = false)} closeButton={true}>
  <div class="results">
    <Results results={$results}/>
  </div>
</Modal>

<style>
  .suggestions {
    padding: var(--rhythm-2);
  }

  .results {
    max-width: 100vw;
    width: var(--default-modal-width);
    height: calc(100vh - var(--rhythm-8));
  }

  @media (min-width: 640px) {
    .results {
      width: calc(100vw - var(--rhythm-14));
      height: calc(90vh - var(--rhythm-16));
    }
  }
</style>
