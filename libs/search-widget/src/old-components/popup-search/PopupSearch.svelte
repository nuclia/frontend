<script lang="ts">
  import Modal from '../../common/modal/Modal.svelte';
  import { nucliaState } from '../../core/old-stores/main.store';
  import Results from '../results/Results.svelte';
  import SearchInput from '../search-input/SearchInput.svelte';
  import { isPopupSearchOpen } from '../../core/stores/modal.store';

  export let placeholder = '';

  let inputElement;

  const results = nucliaState().results;
</script>

<div class="sw-popup-search">
  <div bind:this={inputElement}>
    <SearchInput popupSearch={true}
                 {placeholder}
                 on:search={() => isPopupSearchOpen.set(true)}/>
  </div>

  <Modal show={$isPopupSearchOpen}
         closeButton={true}
         on:close={() => (isPopupSearchOpen.set(false))}>
    <div class="results">
      <Results results={$results} />
    </div>
  </Modal>
</div>

<style lang="scss" src="./PopupSearch.scss"></style>
