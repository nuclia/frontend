<script lang="ts">
  import { _ } from '../../core/i18n';
  import { debounceTime, filter, merge, share, take } from 'rxjs';

  import { createEventDispatcher, onMount } from 'svelte';
  import SearchIcon from '../../components/icons/search.svelte';
  import { nucliaState, nucliaStore } from '../../core/store';
  import Spinner from '../../components/spinner/Spinner.svelte';
  import { getCDN } from "../../core/utils";

  export let popupSearch = false;
  export let embeddedSearch = false;
  export let searchBarWidget = false;
  export let placeholder = '';

  const defaultPlaceholder = 'input.placeholder';

  let value = '';
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
    nucliaState()
      .query.pipe(take(1))
      .subscribe((query) => {
        value = query;
      });
  });

  $: {
    if (value.trim() !== previous.trim()) {
      dispatch('typeahead', value);
    }

    if (typeof value !== 'undefined') {
      nucliaStore().query.next(value);
    }
    previous = value;
  }

  const search = () => {
    nucliaStore().triggerSearch.next();
    dispatch('search', value);
  };

  const onEnter = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      search();
    }
  };
</script>

<form role="search"
      autocomplete="off"
      class="search-input"
      class:search-bar-container="{embeddedSearch || searchBarWidget}">
  <input bind:this={element}
         class="search-field"
         class:input-widget={popupSearch}
         class:embedded-search="{embeddedSearch}"
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
         bind:value
         on:input
         on:keyup
         on:change
         on:keypress={onEnter}
         on:keydown
  />
  {#if popupSearch || embeddedSearch || searchBarWidget}
    <div class="search-icon" class:left-icon={embeddedSearch || searchBarWidget}>
      {#if $isPending}
        <Spinner small/>
      {:else}
        <SearchIcon on:click={search}
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
      <img src={`${getCDN()}logos/nuclia-grey.svg`} alt="Nuclia">
    </div>
  {/if}
</form>

<style>
  form {
    position: relative;
  }

  input {
    font-size: calc(var(--font-size-base) * 1.5);
    font-weight: var(--font-weight-body);
    line-height: calc(var(--line-height-body) * 1.5);
    border: 0;
    font-family: inherit;
    outline: none;
    width: calc(100% - var(--rhythm-0_25));
    color: inherit;
    text-overflow: ellipsis;
    box-sizing: border-box;

    -webkit-appearance: none;
  }

  input::placeholder {
    color: var(--color-neutral-strong);
    transition: all 0s ease;
  }

  .search-bar-widget {
    border: var(--search-bar-border);
    border-radius: var(--search-bar-border-radius);
    font-size: var(--font-size-base);
    max-width: var(--search-bar-max-width);
    padding: var(--search-bar-padding);
  }

  .search-bar-widget:focus,
  .embedded-search:focus {
    border: var(--search-bar-border-focus);
  }

  .embedded-search {
    font-size: var(--font-size-base);
    padding: var(--form-widget-padding);
    border-width: var(--form-widget-border-width);
    border-style: var(--form-widget-border-style);
    border-color: var(--form-widget-border-color);
    border-radius: var(--form-widget-border-radius);
  }

  .input-widget {
    font-size: var(--font-size-base);
    line-height: var(--line-height-body);
    padding: var(--input-widget-padding);
    border-width: var(--input-widget-border-width);
    border-style: var(--input-widget-border-style);
    border-color: var(--input-widget-border-color);
    border-radius: var(--input-widget-border-radius);
  }

  .input-widget:focus,
  .input-widget:active {
    border-style: var(--input-widget-border-style-stronger);
  }

  .input-widget::placeholder {
    color: var(--input-widget-placeholder-color);
  }

  .search-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }

  .search-icon.left-icon {
    left: var(--rhythm-1);
  }
  .search-icon:not(.left-icon) {
    right: var(--rhythm-1);
  }

  .powered-by {
    align-items: center;
    color: var(--color-neutral-regular);
    display: flex;
    gap: var(--rhythm-0_5);
    position: absolute;
    top: 50%;
    right: var(--rhythm-1_5);
    transform: translateY(-50%);
  }
  .powered-by > small {
    font-size: calc(var(--font-size-base) * 0.6);
    font-weight: var(--font-weight-body);
  }

  @media (min-width: 640px) {
    form.search-bar-container {
      width: var(--search-bar-max-width);
    }
  }
</style>
