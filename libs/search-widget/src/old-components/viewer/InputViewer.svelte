<script lang="ts">
  import { _ } from '../../core/i18n';
  import { getCDN } from '../../core/utils';
  import { SearchOrder } from '../../core/models';
  import { viewerStore, viewerState, clearSearch } from '../../core/stores/viewer.store';

  const query = viewerStore.query;
  query['set'] = query.next;

  const order = viewerStore.order;
  order['set'] = order.next;

  const results = viewerState.results;
  const onlySelected = viewerState.onlySelected;

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
        bind:value={$query}
        style:background-image={`url(${getCDN()}icons/search.svg)`}
      />
      {#if $results !== null || $onlySelected}
        <button on:click={showAllParagraphs}>
          <img src={`${getCDN()}icons/close.svg`} alt={$_('resource.show-all')} />
        </button>
      {/if}
    </div>
    <div class="sort">
      <select bind:value={$order}>
        <option value={SearchOrder.RELEVANCE}>{$_('resource.relevance')}</option>
        <option value={SearchOrder.SEQUENTIAL}>{$_('resource.sequential')}</option>
      </select>
    </div>
  </div>
</div>

<style lang="scss" src="./InputViewer.scss"></style>
