<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Icon from '../../common/icons/Icon.svelte';
  import Modal from '../../common/modal/Modal.svelte';
  import Suggestions from '../suggestions/Suggestions.svelte';
  import { addEntityFilter, type EntityFilter, hasSearchButton, searchOptions } from '../../core';
  import {
    _,
    autocomplete,
    autofilters,
    creationEnd,
    creationStart,
    entities,
    entitiesDefaultColor,
    entityFilters,
    getCDN,
    hasFilterButton,
    hasSuggestions,
    hideLogo,
    labelFilters,
    labelSetFilters,
    rangeCreation,
    removeAutofilter,
    removeEntityFilter,
    removeLabelFilter,
    removeLabelSetFilter,
    searchQuery,
    selectedEntity,
    selectNextEntity,
    selectPrevEntity,
    suggestedEntities,
    suggestedLabels,
    suggestedParagraphs,
    suggestionsHasError,
    suggestionState,
    triggerSearch,
    triggerSuggestions,
    typeAhead,
    widgetPlaceholder,
  } from '../../core';
  import { tap } from 'rxjs/operators';
  import Label from '../../common/label/Label.svelte';
  import Chip from '../../common/chip/Chip.svelte';
  import type { Observable } from 'rxjs';
  import { combineLatest, map, take } from 'rxjs';
  import IconButton from '../../common/button/IconButton.svelte';
  import Dropdown from '../../common/dropdown/Dropdown.svelte';
  import SearchFilters from '../search-filters/SearchFilters.svelte';
  import type { Classification } from '@nuclia/core';
  import Textarea from '../../common/textarea/Textarea.svelte';

  let searchInputElement: Textarea;
  const dispatch = createEventDispatcher();
  const brandName = import.meta.env.VITE_BRAND_NAME || 'Nuclia';
  const overrides = import.meta.env.VITE_OVERRIDES || '';

  let inputContainerElement: HTMLElement | undefined;
  let filterButtonElement: HTMLElement | undefined;
  let filterContainerElement: HTMLElement | undefined;
  let filterDropdownPosition: { top: number; left: number; width: number } | undefined;
  let showSuggestions = false;
  let showFilterDropdowns = false;
  let hasFilters = false;
  let filterHeight: string | undefined;

  interface Filter {
    type: 'label' | 'labelset' | 'entity' | 'creation-start' | 'creation-end';
    key: string;
    value: Classification | EntityFilter | string;
    autofilter?: boolean;
  }

  const filters: Observable<Filter[]> = combineLatest([
    rangeCreation,
    labelFilters,
    labelSetFilters,
    entityFilters,
    autofilters,
  ]).pipe(
    map(([rangeCreation, labels, labelSets, entities, autofilters]) => [
      ...Object.entries(rangeCreation)
        .filter(([, value]) => !!value)
        .map(([key, value]) => ({
          type: `creation-${key}`,
          key,
          value: new Intl.DateTimeFormat(navigator.language, { timeZone: 'UTC' }).format(new Date(value)),
        })),
      ...labels.map((value) => ({
        type: 'label',
        key: value.classification.label + value.classification.labelset,
        value: value.classification,
      })),
      ...labelSets.map((value) => ({
        type: 'labelset',
        key: `labelset-${value.id}`,
        value: value.id,
      })),
      ...entities.map((value) => ({
        type: 'entity',
        key: value.family + value.entity,
        value,
      })),
      ...autofilters.map((value) => ({
        type: 'entity',
        key: value.family + value.entity,
        value,
        autofilter: true,
      })),
    ]),
    tap((filters) => {
      // search box size changes when there are filters or not
      const hasFiltersNow = filters.length > 0;
      if (hasFilters !== hasFiltersNow) {
        hasFilters = hasFiltersNow;
      }
      setTimeout(
        () => (filterHeight = filterContainerElement ? `${filterContainerElement.offsetHeight}px` : undefined),
      );
    }),
  );

  const search = (filter?: Filter) => {
    if (filter) removeFilter(filter);
    searchQuery.set(typeAhead.getValue());
    triggerSearch.next();
    dispatch('search');
    // Make sure the keyboard disappear when triggering search in Mobile
    searchInputElement.blur();
  };

  const removeFilter = (filter: Filter) => {
    if (filter.type === 'creation-start') {
      creationStart.set(undefined);
    } else if (filter.type === 'creation-end') {
      creationEnd.set(undefined);
    } else if (filter.type === 'label') {
      removeLabelFilter(filter.value as Classification);
    } else if (filter.type === 'labelset') {
      removeLabelSetFilter(filter.value as string);
    } else if (filter.type === 'entity') {
      filter.autofilter
        ? removeAutofilter(filter.value as EntityFilter)
        : removeEntityFilter(filter.value as EntityFilter);
    }
  };

  const onKeyPress = (event: { detail: KeyboardEvent }) => {
    if (event.detail.key === 'Enter') {
      event.detail.preventDefault();
      const entity = selectedEntity.getValue();
      if (showSuggestions && entity) {
        autocompleteEntity(entity);
      } else {
        search();
      }
      showSuggestions = false;
    } else {
      showSuggestions = true;
    }
  };

  const onKeyUp = (event: { detail: KeyboardEvent }) => {
    if (showSuggestions && suggestedEntities.getValue().length > 0) {
      if (event.detail.key === 'ArrowDown') {
        selectNextEntity.do();
      } else if (event.detail.key === 'ArrowUp') {
        selectPrevEntity.do();
      }
    }
  };

  const autocompleteEntity = (entity: { family: string; value: string }) => {
    searchOptions.pipe(take(1)).subscribe((options) => {
      autocomplete(entity.value);
      if (options.autofilter) {
        // The filter is added manually because autofilter option is not always reliable detecting it
        addEntityFilter({ family: entity.family, entity: entity.value });
      }
      search();
    });
  };

  const closeSuggestions = () => {
    showSuggestions = false;
  };

  const toggleFilter = () => {
    setFilterDropdownPosition();
    showFilterDropdowns = !showFilterDropdowns;
  };

  const setFilterDropdownPosition = () => {
    if (filterButtonElement) {
      const width = 27 * 8;
      const buttonPosition = filterButtonElement.getBoundingClientRect();
      if (buttonPosition.left + width < window.innerWidth) {
        filterDropdownPosition = { top: buttonPosition.top - 5, left: buttonPosition.right + 16, width };
      } else {
        filterDropdownPosition = { top: buttonPosition.bottom + 4, left: buttonPosition.right - width, width };
      }
    }
  };

  function clear() {
    suggestionState.reset();
    searchQuery.set('');
    dispatch('resetQuery');
  }
</script>

<form
  role="search"
  autocomplete="off"
  class="sw-search-input"
  class:has-filters={$filters.length > 0}
  class:has-logo={!$hideLogo}
  bind:this={inputContainerElement}
  style:--filters-height={filterHeight}>
  {#if !$hideLogo}
    <img
      src={`${getCDN()}${overrides}assets/logos/logo-grey.svg`}
      class="logo"
      alt={brandName} />
  {/if}
  <div class="input-container">
    <div
      class="search-icon-container"
      class:has-cross={$typeAhead.length > 0}>
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
    <Textarea
      name="nuclia-search-field"
      ariaLabel="Search input"
      placeholder={$_($widgetPlaceholder)}
      bind:this={searchInputElement}
      bind:value={$typeAhead}
      on:input={() => triggerSuggestions.next()}
      on:keypress={onKeyPress}
      on:keyup={onKeyUp}></Textarea>

    {#if $hasSearchButton && $typeAhead.length > 0}
      <IconButton
        icon="search"
        aspect="basic"
        on:click={search} />
    {/if}
    {#if $hasFilterButton}
      <div bind:this={filterButtonElement}>
        <IconButton
          icon="filter"
          aspect="basic"
          size="medium"
          active={showFilterDropdowns}
          on:click={toggleFilter} />
      </div>
    {/if}
  </div>

  {#if $filters.length > 0}
    <div
      class="filters-container"
      bind:this={filterContainerElement}>
      {#each $filters as filter (filter.key)}
        {#if filter.type === 'creation-start'}
          <Chip
            removable
            color={entitiesDefaultColor}
            on:remove={() => search(filter)}>
            {$_('input.from')}
            {filter.value}
          </Chip>
        {/if}
        {#if filter.type === 'creation-end'}
          <Chip
            removable
            color={entitiesDefaultColor}
            on:remove={() => search(filter)}>
            {$_('input.to')}
            {filter.value}
          </Chip>
        {/if}
        {#if filter.type === 'label'}
          <Label
            label={filter.value}
            removable
            on:remove={() => search(filter)} />
        {/if}
        {#if filter.type === 'labelset'}
          <Label
            label={{ labelset: filter.value, label: '' }}
            removable
            on:remove={() => search(filter)} />
        {/if}
        {#if filter.type === 'entity'}
          <Chip
            removable
            color={$entities.find((family) => family.id === filter.value.family)?.color || entitiesDefaultColor}
            on:remove={() => search(filter)}>
            {filter.value.entity}
          </Chip>
        {/if}
      {/each}
    </div>
  {/if}
</form>

{#if showFilterDropdowns}
  <Dropdown
    position={filterDropdownPosition}
    on:close={() => (showFilterDropdowns = false)}>
    <SearchFilters on:search={() => search()} />
  </Dropdown>
{/if}

<Modal
  show={showSuggestions && ($hasSuggestions || $suggestionsHasError)}
  popup={true}
  parentElement={inputContainerElement}
  on:close={closeSuggestions}>
  <div class="sw-suggestions-container">
    <Suggestions
      on:autocomplete={(event) => autocompleteEntity(event.detail)}
      paragraphs={$suggestedParagraphs}
      entities={$suggestedEntities}
      labels={$suggestedLabels} />
  </div>
</Modal>

<style
  lang="scss"
  src="./SearchInput.scss"></style>
