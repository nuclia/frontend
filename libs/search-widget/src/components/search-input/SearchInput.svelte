<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import IconButton from '../../common/button/IconButton.svelte';
  import Dropdown from '../../common/dropdown/Dropdown.svelte';
  import Icon from '../../common/icons/Icon.svelte';
  import Modal from '../../common/modal/Modal.svelte';
  import Textarea from '../../common/textarea/Textarea.svelte';
  import {
    _,
    addImage,
    autocomplete,
    getCDN,
    hasContextImages,
    hasFilterButton,
    hasFilters,
    hasQueryImage,
    hasSearchButton,
    hasSuggestions,
    hideLogo,
    images,
    isStreaming,
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
  import InputImages from '../input-images/InputImages.svelte';
  import SearchFilters from '../search-filters/SearchFilters.svelte';
  import Suggestions from '../suggestions/Suggestions.svelte';
  import SelectedFilters from '../search-filters/SelectedFilters.svelte';

  let searchInputElement: Textarea = $state();
  const dispatch = createEventDispatcher();
  const brandName = import.meta.env.VITE_BRAND_NAME || 'Agentic RAG';
  const overrides = import.meta.env.VITE_OVERRIDES || '';

  let inputContainerElement: HTMLElement | undefined = $state();
  let filterButtonElement: HTMLElement | undefined = $state();
  let filterDropdownPosition: { top: number; left: number; width: number } | undefined = $state();
  let showSuggestions = $state(false);
  let showFilterDropdowns = $state(false);
  let suggestionsModal: Modal | undefined = $state();
  let fileInputElement: HTMLInputElement | undefined = $state();

  const search = () => {
    searchQuery.set(typeAhead.getValue());
    triggerSearch.next();
    dispatch('search');
    // Make sure the keyboard disappear when triggering search in Mobile
    searchInputElement?.blur();
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

  const onInput = () => {
    triggerSuggestions.next();
    if (showSuggestions) {
      // Make sure the position of the suggestions is correct if the input height changes
      suggestionsModal?.refreshPosition();
    }
  };

  const autocompleteEntity = (entity: { family: string; value: string }) => {
    autocomplete(entity.value);
    search();
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

  function onFileSelected() {
    const file = fileInputElement?.files?.[0];
    if (file) {
      addImage(file);
    }
  }
  function selectImage() {
    fileInputElement?.click();
  }
</script>

<form
  role="search"
  autocomplete="off"
  class="sw-search-input"
  class:has-filters={$hasFilters}
  class:has-logo={!$hideLogo}
  class:disabled={$isStreaming}
  bind:this={inputContainerElement}>
  {#if !$hideLogo}
    <img
      src={`${getCDN()}${overrides}logos/logo-grey.svg`}
      class="logo"
      alt={brandName} />
  {/if}
  <div>
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
            disabled={$isStreaming}
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
        disabled={$isStreaming}
        bind:this={searchInputElement}
        bind:value={$typeAhead}
        on:input={onInput}
        on:keypress={onKeyPress}
        on:keyup={onKeyUp}></Textarea>
      {#if $hasContextImages || $hasQueryImage}
        <input
          type="file"
          accept="image/*"
          onchange={onFileSelected}
          bind:this={fileInputElement} />
        <IconButton
          aspect="basic"
          icon="photo"
          ariaLabel={$_('input.add-image')}
          disabled={$hasQueryImage && $images.length > 0}
          on:click={selectImage}
          on:enter={selectImage} />
      {/if}
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
    <InputImages />
  </div>

  {#if $hasFilters}
    <div class="filters-container">
      <SelectedFilters on:remove={search}></SelectedFilters>
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
  bind:this={suggestionsModal}
  on:close={closeSuggestions}>
  <div class="sw-suggestions-container">
    <Suggestions
      on:autocomplete={(event) => autocompleteEntity(event.detail)}
      paragraphs={$suggestedParagraphs}
      entities={$suggestedEntities}
      labels={$suggestedLabels} />
  </div>
</Modal>

<style src="./SearchInput.css"></style>
