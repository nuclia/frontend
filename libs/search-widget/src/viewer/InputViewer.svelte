<script lang="ts">
  import { _ } from '../core/i18n';
  import { getCDN } from '../core/utils';
  import { SearchOrder } from '../core/models';
  import { viewerStore, viewerState, clearSearch } from './store';

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

<div class="search">
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
      <div class="sort">
        <select bind:value={$order}>
          <option value={SearchOrder.RELEVANCE}>{$_('resource.relevance')}</option>
          <option value={SearchOrder.SEQUENTIAL}>{$_('resource.sequential')}</option>
        </select>
      </div>
    </div>
    {#if $results !== null || $onlySelected}
    <button class="show-all" on:click={showAllParagraphs}>
      <img src={`${getCDN()}icons/close.svg`} alt="reset" />
      <span>{$_('resource.show-all')}</span>
    </button>
  {/if}
  </div>
</div>

<style>
  .search {
    position: sticky;
    top: var(--header-height);
    background-color: #fff;
    padding: 1em 0;
    z-index: 1;
  }
  .search-query {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }
  input {
    flex: 0 1 auto;
    width: 380px;
    height: 40px;
    min-width: 0;
    padding-left: 2.75em;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-body);
    line-height: var(--line-height-body);
    border: 0;
    border-radius: 2px;
    font-family: inherit;
    outline: none;
    color: inherit;
    background-color: var(--color-neutral-lightest);
    background-position: 0.75em center;
    background-repeat: no-repeat;
    text-overflow: ellipsis;
    -webkit-appearance: none;
    appearance: none;
  }
  .search-form button {
    border: 0;
    padding: 0;
    background: transparent;
    -webkit-appearance: none;
    appearance: none;
    cursor: pointer;
  }
  .search-form button img {
    display: block;
    width: 18px;
  }
  .show-all {
    display: flex;
    align-items: center;
    margin: 1em 0 0 1em;
    font-weight: var(--font-weight-bold);
  }
  .show-all span {
    margin-left: 8px;
  }
  .sort {
    flex: 0 1 auto;
  }
  select {
    margin-left: 26px;
    padding-right: 20px;
    border: 0;
    font: inherit;
    font-weight: var(--font-weight-semi-bold);
    background-color: transparent;
    background-image: url('data:image/svg+xml; utf8, <svg width="8" height="6" viewBox="0 0 8 6" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.91237 1.66244L7.08742 0.83743L3.99989 3.92496L0.912358 0.83743L0.0874022 1.66244L3.99989 5.57489L7.91237 1.66244Z"/></svg>');
    background-repeat: no-repeat;
    background-position: right center;
    -webkit-appearance: none;
    appearance: none;
  }
  select:focus-visible {
    outline: 0;
    color: var(--color-neutral-strong);
  }
</style>
