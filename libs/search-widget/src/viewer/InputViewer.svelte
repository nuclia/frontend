<script lang="ts">
  import { _ } from '../core/i18n';
  import { getCDN } from '../core/utils';
  import { SearchOrder } from '../core/models';
  import { viewerStore, viewerState, clearSearch } from './store';
  import { merge, switchMap, map, mapTo, take } from 'rxjs';

  const query = viewerStore.query;
  query['set'] = query.next;

  const order = viewerStore.order;
  order['set'] = order.next;

  const triggerSearch = viewerStore.triggerSearch;
  const results = viewerState.results;
  const onlySelected = viewerState.onlySelected;

  const buttonDisabled = merge(
    query.pipe(mapTo(false)),
    triggerSearch.pipe(
      switchMap(() => viewerState.query.pipe(take(1))),
      map((query) => query.length > 0),
    ),
  );

  const showAllParagraphs = () => {
    clearSearch();
  };

  const onEnter = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      search();
    }
  };
  const search = () => {
    triggerSearch.next();
  };
</script>

<div class="search">
  <label for="nuclia-resource-search">{$_('resource.search')}</label>
  <div class="search-form">
    <div class="search-query">
      <div class="search-input">
        <input
          id="nuclia-resource-search"
          autocomplete="off"
          autocorrect="off"
          autofill="off"
          autocapitalize="off"
          spellcheck="false"
          aria-label="Search input"
          on:keypress={onEnter}
          bind:value={$query}
        />
        <button on:click={search} disabled={$buttonDisabled}>
          <img src={`${getCDN()}icons/search.svg`} alt="search" />
        </button>
      </div>
      {#if $results !== null || $onlySelected}
        <button class="show-all" on:click={showAllParagraphs}>
          <img src={`${getCDN()}icons/close.svg`} alt="reset" />
          <span>{$_('resource.show-all')}</span>
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

<style>
  .search {
    position: sticky;
    top: 0;
    background-color: #fff;
    padding: 1em 0;
    display: flex;
    align-items: flex-start;
    z-index: 1;
  }
  .search label {
    flex: 0 0 auto;
    width: 66px;
    padding-right: 12px;
  }
  .search-form {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex: 1 1 0;
  }
  .search-query {
    display: flex;
    flex-direction: column;
  }
  @media (min-width: 1700px) {
    .search-query {
      flex-direction: row;
      align-items: center;
      flex-wrap: wrap;
    }
  }
  .search-input {
    display: flex;
    align-items: center;
  }
  .search-input input {
    flex: 0 0 auto;
    width: 240px;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-body);
    line-height: var(--line-height-body);
    border: 0;
    border-bottom: 1px solid #000;
    font-family: inherit;
    outline: none;
    color: inherit;
    text-overflow: ellipsis;
    -webkit-appearance: none;
    appearance: none;
  }
  @media (max-width: 1200px) {
    .search-query,
    .search-input,
    .search-input input {
      flex: 1 1 auto;
      width: auto;
    }
  }
  .search-form button {
    border: 0;
    padding: 0;
    background: transparent;
    -webkit-appearance: none;
    appearance: none;
  }
  .search-form button:not(:disabled) {
    cursor: pointer;
  }
  .search-form button:disabled {
    opacity: 0.3;
  }
  .search-form button img {
    display: block;
  }
  .show-all {
    display: flex;
    align-items: center;
    margin: 1.5em 0 0 0;
    font-weight: var(--font-weight-bold);
  }
  @media (min-width: 1700px) {
    .show-all {
      margin: 0 0 0 2em;
    }
  }
  .show-all span {
    margin-left: 8px;
  }
  .sort {
    flex: 0 1 auto;
  }
  @media (max-width: 1200px) {
    .sort {
      display: none;
    }
  }
  select {
    margin-left: 26px;
    height: 32px;
    padding: 0 24px 0 14px;
    box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.16);
    border: 0;
    font: inherit;
    font-weight: var(--font-weight-semi-bold);
    border-radius: 4px;
    background-color: var(--color-dark-light);
    -webkit-appearance: none;
    appearance: none;
  }
  select:focus-visible {
    outline: 0;
    box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  }
</style>
