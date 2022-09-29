<script lang="ts">
  import { _ } from '../../core/i18n';
  import { debounceTime, filter, merge, share } from 'rxjs';

  import { createEventDispatcher, onMount } from 'svelte';
  import SearchIcon from '../../components/icons/search.svelte';
  import { nucliaState, nucliaStore } from '../../core/store';
  import LoadingDots from '../../common/spinner/LoadingDots.svelte';
  import { getCDN } from '../../core/utils';

  export let popupSearch = false;
  export let embeddedSearch = false;
  export let searchBarWidget = false;
  export let placeholder = '';

  const defaultPlaceholder = 'input.placeholder';

  const query = nucliaStore().query;
  query['set'] = query.next;

  let previous = '';
  let element: HTMLInputElement;
  const dispatch = createEventDispatcher();
  const pendingSuggestions = nucliaState().pendingSuggestions.pipe(share());
  const isPending = merge(
    pendingSuggestions.pipe(filter((pending) => pending)),
    pendingSuggestions.pipe(
      filter((pending) => !pending),
      debounceTime(500),
    ),
  );

  onMount(() => {
    element.focus();
  });

  const search = () => {
    nucliaStore().triggerSearch.next();
    dispatch('search');
  };

  const onChange = (event: InputEvent) => {
    const query = (event.target as HTMLInputElement).value;
    if (query.trim() !== previous.trim()) {
      dispatch('typeahead', query);
    }
    previous = query;
  }

  const onEnter = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      search();
    }
  };
</script>

<form
  role="search"
  autocomplete="off"
  class="sw-search-input"
  class:search-bar-container={embeddedSearch || searchBarWidget}
>
  <input
    bind:this={element}
    class="search-field"
    class:input-widget={popupSearch}
    class:embedded-search={embeddedSearch}
    class:search-bar-widget={searchBarWidget}
    name="nuclia-search-field"
    placeholder={$_(placeholder || defaultPlaceholder)}
    tabindex="0"
    autocomplete="off"
    autocorrect="off"
    autofill="off"
    autocapitalize="off"
    spellcheck="false"
    aria-label="Search input"
    bind:value={$query}
    on:input={onChange}
    on:keyup
    on:change
    on:keypress={onEnter}
    on:keydown
  />
  {#if popupSearch || embeddedSearch || searchBarWidget}
    <div class="search-icon" class:left-icon={embeddedSearch || searchBarWidget}>
      {#if $isPending}
        <LoadingDots small />
      {:else}
        <SearchIcon
          on:click={search}
          on:keyup={(e) => {
            if (e.key === 'Enter') {
              search();
            }
          }}
        />
      {/if}
    </div>
  {/if}
  {#if embeddedSearch || searchBarWidget}
    <div class="powered-by">
      <small>Powered by</small>
      <img src={`${getCDN()}logos/nuclia-grey.svg`} alt="Nuclia" />
    </div>
  {/if}
</form>

<style lang="scss" src="./SearchInput.scss"></style>
