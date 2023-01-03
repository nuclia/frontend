<script lang="ts">
  import { _ } from '../../core/i18n';
  import { getCDN } from '../../core/utils';
  import { SearchOrder } from '../../core/models';
  import { viewerState, clearSearch } from './store/viewer.store';
  import { viewerSearchOrder, viewerSearchQuery, viewerSearchResults } from '../../core/stores/viewer-search.store';
  import { createEventDispatcher } from 'svelte';

  const onlySelected = viewerState.onlySelected;

  const dispatch = createEventDispatcher();

  const onKeyup = (event) => {
    if (event.key === 'Enter') {
      dispatch('triggerSearch');
    }
  };

  const showAllParagraphs = () => {
    clearSearch();
  };
</script>

<div class="sw-viewer-input">
  <div class="search-form">
    <div class="search-query">
      <input
        autocomplete="off"
        autocorrect="off"
        autofill="off"
        autocapitalize="off"
        spellcheck="false"
        aria-label="Search input"
        bind:value={$viewerSearchQuery}
        on:keyup={onKeyup}
        style:background-image={`url(${getCDN()}icons/search.svg)`} />
      {#if $viewerSearchResults !== null || $onlySelected}
        <button on:click={showAllParagraphs}>
          <img
            src={`${getCDN()}icons/close.svg`}
            alt={$_('resource.show-all')} />
        </button>
      {/if}
    </div>
    <div class="sort">
      <select bind:value={$viewerSearchOrder}>
        <option value={SearchOrder.RELEVANCE}>{$_('resource.relevance')}</option>
        <option value={SearchOrder.SEQUENTIAL}>{$_('resource.sequential')}</option>
      </select>
    </div>
  </div>
</div>

<style
  lang="scss"
  src="./InputViewer.scss"></style>
