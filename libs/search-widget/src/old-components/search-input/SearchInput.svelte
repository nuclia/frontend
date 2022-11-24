<script lang="ts">
  import { _ } from '../../core/i18n';
  import { createEventDispatcher, onMount } from 'svelte';
  import { nucliaState, nucliaStore, removeLabelFilter } from '../../core/old-stores/main.store';
  import { getCDN } from '../../core/utils';
  import Icon from '../../common/icons/Icon.svelte';
  import Modal from '../../common/modal/Modal.svelte';
  import Suggestions from '../suggestions/Suggestions.svelte';
  import {
    hasSuggestions,
    suggestedLabels,
    suggestedParagraphs,
    suggestionsHasError,
    typeAhead,
  } from '../../core/stores/suggestions.store';
  import { tap } from 'rxjs/operators';
  import Label from '../../common/label/Label.svelte';
  import { map, Observable } from 'rxjs';
  import type { Classification } from '@nuclia/core';
  import { getLabelFromFilter } from '@nuclia/core';
  import IconButton from '../../common/button/IconButton.svelte';

  export let popupSearch = false;
  export let embeddedSearch = false;
  export let searchBarWidget = false;
  export let placeholder = '';
  export let hasFilterButton = false;

  const defaultPlaceholder = 'input.placeholder';

  let element: HTMLInputElement;
  const dispatch = createEventDispatcher();

  let inputContainerElement: HTMLElement | undefined;
  let position: DOMRect | undefined;
  let showSuggestions = false;
  let hasFilters = false;
  const filters = nucliaState().filters.pipe(
    tap((filters) => {
      // search box size changes when there are filters or not
      const hasFiltersNow = filters.length > 0;
      if (hasFilters !== hasFiltersNow) {
        hasFilters = hasFiltersNow;
        setTimeout(() => setInputPosition());
      }
    }),
  );
  const labels: Observable<Classification[]> = filters.pipe(
    map((filters) => filters.map((filter) => getLabelFromFilter(filter))),
  );

  const suggestionModalMinWidth = 384;
  let suggestionModalWidth;
  $: {
    if (inputContainerElement) {
      suggestionModalWidth = `${Math.max(inputContainerElement.offsetWidth, suggestionModalMinWidth)}px`;
    }
  }

  onMount(() => {
    setInputPosition();
  });

  const setInputPosition = () => {
    if (inputContainerElement) {
      position = inputContainerElement.getBoundingClientRect();
    }
  };

  const search = () => {
    nucliaStore().query.next(typeAhead.getValue());
    nucliaStore().triggerSearch.next();
    dispatch('search');
  };

  const onKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      search();
      showSuggestions = false;
    } else {
      showSuggestions = true;
    }
  };

  const closeSuggestions = () => {
    showSuggestions = false;
  };
</script>

<svelte:window on:resize={setInputPosition} />
<form
  role="search"
  autocomplete="off"
  class="sw-search-input"
  class:popup-widget={popupSearch}
  class:embedded-widget={embeddedSearch}
  class:search-bar-widget={searchBarWidget}
  class:has-filters={$filters.length > 0}
  bind:this={inputContainerElement}>
  {#if embeddedSearch || searchBarWidget}
    <img
      src={`${getCDN()}logos/nuclia-grey.svg`}
      class="logo"
      alt="Nuclia" />
  {/if}
  <div class="input-container">
    <div class="search-icon-container">
      <div
        class="search-icon"
        tabIndex="0"
        on:click={search}
        on:keyup={(e) => {
          if (e.key === 'Enter') {
            search();
          }
        }}>
        <Icon name="search" />
      </div>
    </div>
    <input
      bind:this={element}
      class="search-field"
      name="nuclia-search-field"
      placeholder={$_(placeholder || defaultPlaceholder)}
      tabindex="0"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      aria-label="Search input"
      bind:value={$typeAhead}
      on:keypress={onKeyPress} />

    {#if hasFilterButton}
      <IconButton
        icon="filter"
        aspect="basic"
        size={popupSearch ? 'small' : 'medium'} />
    {/if}
  </div>

  {#if $filters.length > 0}
    <div class="filters-container">
      {#each $labels as label (label.label)}
        <Label
          {label}
          removable
          on:remove={() => removeLabelFilter(label)} />
      {/each}
    </div>
  {/if}
</form>

<Modal
  show={showSuggestions && ($hasSuggestions || $suggestionsHasError)}
  popup={true}
  parentPosition={position}
  modalWidth={suggestionModalWidth}
  on:close={closeSuggestions}>
  <div class="sw-suggestions-container">
    <Suggestions
      paragraphs={$suggestedParagraphs}
      labels={$suggestedLabels} />
  </div>
</Modal>

<style
  lang="scss"
  src="./SearchInput.scss"></style>
