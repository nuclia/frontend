<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Icon from '../../common/icons/Icon.svelte';
  import Modal from '../../common/modal/Modal.svelte';
  import Suggestions from '../suggestions/Suggestions.svelte';
  import type { EntityFilter } from '../../core';
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
    widgetPlaceholder
  } from '../../core';
  import { tap } from 'rxjs/operators';
  import Label from '../../common/label/Label.svelte';
  import Chip from '../../common/chip/Chip.svelte';
  import type { Observable } from 'rxjs';
  import { combineLatest, map } from 'rxjs';
  import IconButton from '../../common/button/IconButton.svelte';
  import Dropdown from '../../common/dropdown/Dropdown.svelte';
  import type { LabelFilter } from '../../common';
  import SearchFilters from '../search-filters/SearchFilters.svelte';

  let searchInputElement: HTMLInputElement;
  const dispatch = createEventDispatcher();

  let inputContainerElement: HTMLElement | undefined;
  let filterButtonElement: HTMLElement | undefined;
  let filterContainerElement: HTMLElement | undefined;
  let position: DOMRect | undefined;
  let filterButtonPosition: DOMRect | undefined;
  let showSuggestions = false;
  let showFilterDropdowns = false;
  let hasFilters = false;
  let filterHeight: string | undefined;

  const filters: Observable<
    {
      type: 'label' | 'labelset' | 'entity' | 'creation-start' | 'creation-end';
      key: string;
      value: LabelFilter | EntityFilter | string;
      autofilter?: boolean;
    }[]
  > = combineLatest([rangeCreation, labelFilters, labelSetFilters, entityFilters, autofilters]).pipe(
    map(([rangeCreation, labels, labelSets, entities, autofilters]) => [
      ...Object.entries(rangeCreation).filter(([,value]) => !!value).map(([key, value]) => ({
        type: `creation-${key}`,
        key,
        value: new Intl.DateTimeFormat(navigator.language, { timeZone: 'UTC' }).format(new Date(value)),
      })),
      ...labels.map((value) => ({
        type: 'label',
        key: value.classification.label + value.classification.labelset,
        value: value.classification
      })),
      ...labelSets.map((value) => ({
        type: 'labelset',
        key: `labelset-${value.id}`,
        value: value.id
      })),
      ...entities.map((value) => ({
        type: 'entity',
        key: value.family + value.entity,
        value
      })),
      ...autofilters.map((value) => ({
        type: 'entity',
        key: value.family + value.entity,
        value,
        autofilter: true
      }))
    ]),
    tap((filters) => {
      // search box size changes when there are filters or not
      const hasFiltersNow = filters.length > 0;
      if (hasFilters !== hasFiltersNow) {
        hasFilters = hasFiltersNow;
        setTimeout(() => setInputPosition());
      }
      setTimeout(() => filterHeight = filterContainerElement ? `${filterContainerElement.offsetHeight}px` : undefined);
    })
  );

  const suggestionModalMinWidth = 384;
  let suggestionModalWidth: string;
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
      if (showSuggestions && selectedEntity.getValue()) {
        autocomplete(selectedEntity.getValue());
      }
      else {
        search();
      }
      showSuggestions = false;
    } else {
      showSuggestions = true;
      setInputPosition();
    }
  };

  const onKeyUp = (event: KeyboardEvent) => {
    if (showSuggestions && suggestedEntities.getValue().length > 0) {
      if (event.key === 'ArrowDown') {
        selectNextEntity.do();
      }
      else if (event.key === 'ArrowUp') {
        selectPrevEntity.do();
      }
    }
  }

  const closeSuggestions = () => {
    showSuggestions = false;
  };

  const toggleFilter = () => {
    if (filterButtonElement) {
      filterButtonPosition = filterButtonElement.getBoundingClientRect();
    }
    showFilterDropdowns = !showFilterDropdowns;
  };

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
  class:has-filters={$filters.length > 0}
  class:has-logo={!$hideLogo}
  bind:this={inputContainerElement}
  style:--filters-height={filterHeight}
>
  {#if !$hideLogo}
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
      on:keypress={onKeyPress}
      on:keyup={onKeyUp}/>

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
    <div class="filters-container" bind:this={filterContainerElement}>
      {#each $filters as filter (filter.key)}
        {#if filter.type === 'creation-start'}
          <Chip
            removable
            color={entitiesDefaultColor}
            on:remove={() => creationStart.set(undefined)}>
            {$_('input.from')} {filter.value}
          </Chip>
        {/if}
        {#if filter.type === 'creation-end'}
          <Chip
            removable
            color={entitiesDefaultColor}
            on:remove={() => creationEnd.set(undefined)}>
            {$_('input.to')} {filter.value}
          </Chip>
        {/if}
        {#if filter.type === 'label'}
          <Label
            label={filter.value}
            removable
            on:remove={() => removeLabelFilter(filter.value)} />
        {/if}
        {#if filter.type === 'labelset'}
          <Label
            label={{ labelset: filter.value, label: '' }}
            removable
            on:remove={() => removeLabelSetFilter(filter.value)} />
        {/if}
        {#if filter.type === 'entity'}
          <Chip
            removable
            color={$entities.find((family) => family.id === filter.value.family)?.color || entitiesDefaultColor}
            on:remove={() => (filter.autofilter ? removeAutofilter(filter.value) : removeEntityFilter(filter.value))}>
            {filter.value.entity}
          </Chip>
        {/if}
      {/each}
    </div>
  {/if}
</form>

{#if showFilterDropdowns}
  <Dropdown
    position={{ top: filterButtonPosition.top - 5, left: filterButtonPosition.right + 16 }}
    on:close={() => (showFilterDropdowns = false)}>
    <SearchFilters />
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
      on:search={() => search()}
      paragraphs={$suggestedParagraphs}
      entities={$suggestedEntities}
      labels={$suggestedLabels} />
  </div>
</Modal>

<style
  lang="scss"
  src="./SearchInput.scss"></style>
