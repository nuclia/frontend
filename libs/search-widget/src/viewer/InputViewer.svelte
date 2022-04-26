<script lang="ts">
  import { _ } from '../core/i18n';
  import { getCDN } from '../core/utils';

  import { viewerStore } from './store';

  const query = viewerStore.query;
  query['set'] = query.next;

  const reset = () => {
    query.next('');
  };
</script>

<div class="search">
  <label for="nuclia-resource-search">{$_('Search')}</label>
  <input
    id="nuclia-resource-search"
    autocomplete="off"
    autocorrect="off"
    autofill="off"
    autocapitalize="off"
    spellcheck="false"
    aria-label="Search input"
    bind:value={$query}
  />
  <button>
    <img src={`${getCDN()}icons/search.svg`} alt="search" />
  </button>
  {#if $query.length > 0}
    <button on:click={reset}>
      <img src={`${getCDN()}icons/reset.svg`} alt="reset" />
    </button>
  {/if}
</div>

<style>
  .search {
    position: sticky;
    top: 0;
    background-color: #fff;
    padding: 1em 0;
    display: flex;
    align-items: center;
    z-index: 1;
  }
  .search label {
    flex: 0 0 auto;
    width: 66px;
    padding-right: 12px;
    font-weight: var(--font-weight-bold);
  }
  .search input {
    flex: 1 1 0;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-body);
    line-height: var(--line-height-body);
    border: 0;
    border-bottom: 1px solid #000;
    font-family: inherit;
    outline: none;
    color: inherit;
    -webkit-appearance: none;
  }
  .search button {
    flex: 0 0 auto;
    border: 0;
    padding: 0;
    margin: 0 0 0 8px;
    background: transparent;
    cursor: pointer;
    -webkit-appearance: none;
  }
</style>
