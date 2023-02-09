<script lang="ts">
  import { _ } from '../../core/i18n';
  import { createEventDispatcher } from 'svelte';
  import { getCDN } from '../../core/utils';
  import Icon from '../../common/icons/Icon.svelte';
  import Modal from '../../common/modal/Modal.svelte';
  import Suggestions from '../suggestions/Suggestions.svelte';
  import {
    hasSuggestions,
    suggestedLabels,
    suggestedParagraphs,
    suggestionsHasError,
    suggestionState,
    triggerSuggestions,
    typeAhead,
  } from '../../core/stores/suggestions.store';
  import { tap } from 'rxjs/operators';
  import Label from '../../common/label/Label.svelte';
  import { map, Observable } from 'rxjs';
  import type { Classification } from '@nuclia/core';
  import { getLabelFromFilter } from '@nuclia/core';
  import IconButton from '../../common/button/IconButton.svelte';
  import Dropdown from '../../common/dropdown/Dropdown.svelte';
  import { LabelSetWithId, orderedLabelSetList } from '../../core/stores/labels.store';
  import { getParentLiRect } from '../../common/label/label.utils';
  import Button from '../../common/button/Button.svelte';
  import { hasFilterButton, widgetPlaceholder } from '../../core/stores/widget.store';
  import {
    addLabelFilter,
    removeLabelFilter,
    searchFilters,
    searchQuery,
    triggerSearch,
  } from '../../core/stores/search.store';

  export let popupSearch = false;
  export let embeddedSearch = false;
  export let searchBarWidget = false;

  let searchInputElement: HTMLInputElement;
  const dispatch = createEventDispatcher();

  let inputContainerElement: HTMLElement | undefined;
  let filterButtonElement: HTMLElement | undefined;
  let labelSetDropdownElement: HTMLElement | undefined;
  let moreFilterElement: HTMLElement | undefined;
  let selectedLabelSet: LabelSetWithId | undefined;
  let position: DOMRect | undefined;
  let filterButtonPosition: DOMRect | undefined;
  let moreFilterPosition: { left: number; top: number } | undefined;
  let submenuPosition: { left: number; top: number } | undefined;
  let showSuggestions = false;
  let showFilterDropdowns = false;
  let showFilterSubmenu = false;
  let hasFilters = false;
  let displayMoreFilters = false;
  const filterDisplayLimit = popupSearch ? 1 : 2;

  const filters = searchFilters.pipe(
    tap((filters) => {
      // search box size changes when there are filters or not
      const hasFiltersNow = filters.length > 0;
      if (hasFilters !== hasFiltersNow) {
        hasFilters = hasFiltersNow;
        setTimeout(() => setInputPosition());
      }
    }),
  );
  let selectedLabels: string[] = [];
  const labels: Observable<Classification[]> = filters.pipe(
    map((filters) => filters.map((filter) => getLabelFromFilter(filter))),
    tap((labelFilters) => (selectedLabels = labelFilters.map((label) => label.label))),
  );
  const labelSets: Observable<LabelSetWithId[]> = orderedLabelSetList;

  const suggestionModalMinWidth = 384;
  let suggestionModalWidth;
  $: {
    if (inputContainerElement) {
      suggestionModalWidth = `${Math.max(inputContainerElement.offsetWidth, suggestionModalMinWidth)}px`;
    }
  }

  const setInputPosition = () => {
    if (inputContainerElement) {
      position = inputContainerElement.getBoundingClientRect();
    }
  };

  const search = () => {
    searchQuery.set(typeAhead.getValue());
    triggerSearch.next();
    dispatch('search');
    // Make sure the keyboard disappear when triggering search in Mobile
    searchInputElement.blur();
  };

  const onKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      search();
      showSuggestions = false;
    } else {
      showSuggestions = true;
      setInputPosition();
    }
  };

  const closeSuggestions = () => {
    showSuggestions = false;
  };

  const toggleFilter = () => {
    if (filterButtonElement) {
      filterButtonPosition = filterButtonElement.getBoundingClientRect();
    }
    showFilterDropdowns = !showFilterDropdowns;
  };

  const showMoreFilters = () => {
    if (moreFilterElement && inputContainerElement) {
      const buttonRect = moreFilterElement.getBoundingClientRect();
      moreFilterPosition = { left: buttonRect.left, top: buttonRect.top + buttonRect.height + 6 };
    }
    displayMoreFilters = true;
  };

  const selectLabel = (label) => {
    showFilterSubmenu = false;
    if (selectedLabelSet) {
      addLabelFilter({ labelset: selectedLabelSet.id, label: label.title });
      selectedLabelSet = undefined;
    }
  };

  function openSubMenu(event, labelSet) {
    selectedLabelSet = labelSet;
    if (labelSetDropdownElement) {
      const dropdownRect = labelSetDropdownElement?.getBoundingClientRect();
      const top = getParentLiRect(event)?.top || event.clientY;
      submenuPosition = { left: dropdownRect.right, top };
      showFilterSubmenu = true;
    }
  }

  function clear() {
    suggestionState.reset();
    searchQuery.set('');
  }
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
      {#if $typeAhead.length > 0}
        <IconButton
          aspect="basic"
          icon="cross"
          ariaLabel={$_('input.clear')}
          size="small"
          on:click={clear}
          on:enter={clear} />
      {:else}
        <div class="search-icon">
          <Icon name="search" />
        </div>
      {/if}
    </div>
    <input
      bind:this={searchInputElement}
      class="search-field"
      name="nuclia-search-field"
      placeholder={$_($widgetPlaceholder)}
      tabindex="0"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      aria-label="Search input"
      bind:value={$typeAhead}
      on:input={() => triggerSuggestions.next()}
      on:keypress={onKeyPress} />

    {#if $hasFilterButton}
      <div bind:this={filterButtonElement}>
        <IconButton
          icon="filter"
          aspect="basic"
          size={popupSearch ? 'small' : 'medium'}
          on:click={toggleFilter} />
      </div>
    {/if}
  </div>

  {#if $filters.length > 0}
    <div class="filters-container">
      {#each $labels.slice(0, filterDisplayLimit) as label (label.labelset + label.label)}
        <Label
          {label}
          removable
          on:remove={() => removeLabelFilter(label)} />
      {/each}
      {#if $labels.length > filterDisplayLimit}
        <div bind:this={moreFilterElement}>
          <Button
            aspect="basic"
            size="small"
            active={displayMoreFilters}
            on:click={showMoreFilters}>
            {$_('input.more_filters', { count: $labels.length - filterDisplayLimit })}
          </Button>
        </div>
        {#if displayMoreFilters}
          <Dropdown
            position={moreFilterPosition}
            on:close={() => (displayMoreFilters = false)}>
            <ul class="more-filters-dropdown">
              {#each $labels.slice(filterDisplayLimit) as label (label.labelset + label.label)}
                <li>
                  <Label
                    {label}
                    removable
                    on:remove={() => removeLabelFilter(label)} />
                </li>
              {/each}
            </ul>
          </Dropdown>
        {/if}
      {/if}
    </div>
  {/if}
</form>

{#if showFilterDropdowns}
  <Dropdown
    position={{ top: filterButtonPosition.top - 5, left: filterButtonPosition.right + 16 }}
    on:close={() => (showFilterDropdowns = false)}>
    <ul
      class="sw-dropdown-options"
      bind:this={labelSetDropdownElement}>
      {#each $labelSets as labelSet}
        <li
          class="label-set-option"
          on:mouseenter={(event) => openSubMenu(event, labelSet)}>
          <div
            class="label-set-color"
            style:background-color={labelSet.color} />
          <div class="label-set-title ellipsis">{labelSet.title}</div>
          <Icon name="chevron-right" />
        </li>
      {/each}
    </ul>
  </Dropdown>
{/if}
{#if showFilterSubmenu}
  <Dropdown
    secondary
    position={submenuPosition}
    on:close={() => (showFilterSubmenu = false)}>
    <ul class="sw-dropdown-options">
      {#each selectedLabelSet.labels as label}
        <li
          class="ellipsis"
          class:selected={selectedLabels.includes(label.title)}
          on:click={() => selectLabel(label)}>
          {label.title}
        </li>
      {/each}
    </ul>
  </Dropdown>
{/if}

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
