<script lang="ts">
  import Modal from '../../common/modal/Modal.svelte';
  import { nucliaState } from '../../core/old-stores/main.store';
  import Results from '../results/Results.svelte';
  import SearchInput from '../search-input/SearchInput.svelte';

  export let placeholder = '';

  let showModal = false;
  let inputElement;

  const openResults = () => {
    showModal = true;
  };
  const results = nucliaState().results;
</script>

<div class="sw-popup-search">
  <div bind:this={inputElement}>
    <SearchInput on:search={openResults} popupSearch={true} {placeholder} />
  </div>

  <Modal show={showModal} on:close={() => (showModal = false)} closeButton={true}>
    <div class="results">
      <Results results={$results} />
    </div>
  </Modal>
</div>

<style lang="scss" src="./PopupSearch.scss"></style>
