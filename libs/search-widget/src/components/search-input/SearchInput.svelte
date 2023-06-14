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
  import Chip from '../../common/chip/Chip.svelte';
  import type { Observable } from 'rxjs';
  import { combineLatest, map } from 'rxjs';
  import IconButton from '../../common/button/IconButton.svelte';
  import Dropdown from '../../common/dropdown/Dropdown.svelte';
  import type { LabelSetWithId } from '../../core/stores/labels.store';
  import { orderedLabelSetList } from '../../core/stores/labels.store';
  import { getParentLiRect, LabelFilter } from '../../common/label/label.utils';
  import Button from '../../common/button/Button.svelte';
  import { hasFilterButton, widgetPlaceholder } from '../../core/stores/widget.store';
  import {
    addEntityFilter,
    addLabelFilter,
    entityFilters,
    labelFilters,
    removeEntityFilter,
    removeLabelFilter,
    searchQuery,
    triggerSearch,
  } from '../../core/stores/search.store';
  import { entities } from '../../core/stores/entities.store';
  import type { EntityGroup } from '../../core/models';

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
  let selectedFamily: EntityGroup | undefined;
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

  const filters = combineLatest([labelFilters, entityFilters]).pipe(
    map(([labels, entities]) => [
      ...labels.map((value) => ({
        type: 'label',
        key: value.classification.label + value.classification.labelset,
        value: value.classification,
      })),
      ...entities.map((value) => ({
        type: 'entity',
        key: value.family + value.entity,
        value,
      })),
    ]),
    tap((filters) => {
      // search box size changes when there are filters or not
      const hasFiltersNow = filters.length > 0;
      if (hasFilters !== hasFiltersNow) {
        hasFilters = hasFiltersNow;
        setTimeout(() => setInputPosition());
      }
    }),
  );

  const selectedLabels: Observable<string[]> = labelFilters.pipe(
    map((filters) => filters.map((filter) => filter.classification.label)),
  );
  const selectedEntities: Observable<string[]> = entityFilters.pipe(
    map((filters) => filters.map((filter) => filter.entity)),
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

  const selectEntity = (entity) => {
    showFilterSubmenu = false;
    if (selectedFamily) {
      addEntityFilter({ family: selectedFamily.id, entity });
      selectedFamily = undefined;
    }
  };

  const selectLabel = (label) => {
    showFilterSubmenu = false;
    if (selectedLabelSet) {
      addLabelFilter({ labelset: selectedLabelSet.id, label: label.title }, selectedLabelSet.kind);
      selectedLabelSet = undefined;
    }
  };

  function openSubMenu(event, labelSet, family) {
    selectedLabelSet = labelSet;
    selectedFamily = family;
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
      {#each $filters.slice(0, filterDisplayLimit) as filter (filter.key)}
        {#if filter.type === 'label'}
          <Label
            label={filter.value}
            removable
            on:remove={() => removeLabelFilter(filter.value)} />
        {/if}
        {#if filter.type === 'entity'}
          <Chip
            removable
            color={$entities.find((family) => family.id === filter.value.family)?.color}
            on:remove={() => removeEntityFilter(filter.value)}>
            {filter.value.entity}
          </Chip>
        {/if}
      {/each}
      {#if $filters.length > filterDisplayLimit}
        <div bind:this={moreFilterElement}>
          <Button
            aspect="basic"
            size="small"
            active={displayMoreFilters}
            on:click={showMoreFilters}>
            {$_('input.more_filters', { count: $filters.length - filterDisplayLimit })}
          </Button>
        </div>
        {#if displayMoreFilters}
          <Dropdown
            position={moreFilterPosition}
            on:close={() => (displayMoreFilters = false)}>
            <ul class="more-filters-dropdown">
              {#each $filters.slice(filterDisplayLimit) as filter (filter.key)}
                <li>
                  {#if filter.type === 'label'}
                    <Label
                      label={filter.value}
                      removable
                      on:remove={() => removeLabelFilter(filter.value)} />
                  {/if}
                  {#if filter.type === 'entity'}
                    <Chip
                      removable
                      color={$entities.find((family) => family.id === filter.value.family)?.color}
                      on:remove={() => removeEntityFilter(filter.value)}>
                      {filter.value.entity}
                    </Chip>
                  {/if}
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
          class="filter-option"
          on:mouseenter={(event) => openSubMenu(event, labelSet)}>
          <div
            class="filter-color"
            style:background-color={labelSet.color} />
          <div class="filter-title ellipsis">{labelSet.title}</div>
          <Icon name="chevron-right" />
        </li>
      {/each}
      {#each $entities as family}
        <li
          class="filter-option"
          on:mouseenter={(event) => openSubMenu(event, undefined, family)}>
          <div
            class="filter-color"
            style:background-color={family.color} />
          <div class="filter-title ellipsis">
            {family.title}
          </div>
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
      {#if selectedLabelSet}
        {#each selectedLabelSet.labels as label}
          <li
            class="ellipsis"
            class:selected={$selectedLabels.includes(label.title)}
            on:click={() => selectLabel(label)}>
            {label.title}
          </li>
        {/each}
      {/if}
      {#if selectedFamily}
        {#each selectedFamily.entities as entity}
          <li
            class="ellipsis"
            class:selected={$selectedEntities.includes(entity)}
            on:click={() => selectEntity(entity)}>
            {entity}
          </li>
        {/each}
      {/if}
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
