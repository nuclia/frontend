<script lang="ts">
  import { _ } from '../../core/i18n';
  import { createEventDispatcher, onMount } from 'svelte';
  import { addLabelFilter, nucliaState, nucliaStore, removeLabelFilter } from '../../core/old-stores/main.store';
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
  import Dropdown from '../../common/dropdown/Dropdown.svelte';
  import { LabelSetWithId, orderedLabelSetList } from '../../core/stores/labels.store';
  import { getParentLiRect } from '../../common/label/label.utils';
  import Button from '../../common/button/Button.svelte';
  import { hasFilterButton, widgetPlaceholder } from '../../core/stores/widget.store';

  export let popupSearch = false;
  export let embeddedSearch = false;
  export let searchBarWidget = false;

  let element: HTMLInputElement;
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

  const toggleFilter = () => {
    if (filterButtonElement) {
      filterButtonPosition = filterButtonElement.getBoundingClientRect();
    }
    showFilterDropdowns = !showFilterDropdowns;
  };

  const showMoreFilters = () => {
    if (moreFilterElement && inputContainerElement) {
      const containerRect = inputContainerElement.getBoundingClientRect();
      const buttonRect = moreFilterElement.getBoundingClientRect();
      moreFilterPosition = {
        left: popupSearch
          ? buttonRect.left - containerRect.right - 16
          : buttonRect.left - containerRect.width + buttonRect.width + 16,
        top: buttonRect.top - containerRect.top + buttonRect.height,
      };
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
      placeholder={$_($widgetPlaceholder)}
      tabindex="0"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      aria-label="Search input"
      bind:value={$typeAhead}
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
          <div class="label-set-title">{labelSet.title}</div>
          <Icon name="chevron-right" />
        </li>
      {/each}
    </ul>
  </Dropdown>
{/if}
{#if showFilterSubmenu}
  <Dropdown
    position={submenuPosition}
    on:close={() => (showFilterSubmenu = false)}>
    <ul class="sw-dropdown-options">
      {#each selectedLabelSet.labels as label}
        <li
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
