<script lang="ts">
  import Modal from '../../common/modal/Modal.svelte';
  import Results from '../results/Results.svelte';
  import SearchInput from '../search-input/SearchInput.svelte';
  import { isPopupSearchOpen } from '../../core/stores/modal.store';
  import { smartResults } from '../../core/stores/search.store';

  let inputElement;
</script>

<div class="sw-popup-search">
  <div bind:this={inputElement}>
    <SearchInput
      popupSearch={true}
      on:search={() => isPopupSearchOpen.set(true)} />
  </div>

  <Modal
    show={$isPopupSearchOpen}
    closeButton={true}
    on:close={() => isPopupSearchOpen.set(false)}>
    <div class="results">
      <Results results={$smartResults} />
    </div>
  </Modal>
</div>

<style
  lang="scss"
  src="./PopupSearch.scss"></style>
