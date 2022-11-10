<script lang="ts">
  import { _ } from '../../core/i18n';
  import { createEventDispatcher, onMount } from 'svelte';
  import { nucliaState, nucliaStore } from '../../core/old-stores/main.store';
  import { getCDN } from '../../core/utils';
  import Icon from '../../common/icons/Icon.svelte';
  import Modal from '../../common/modal/Modal.svelte';
  import Suggestions from '../suggestions/Suggestions.svelte';
  import {
    hasSuggestions,
    suggestedIntents,
    suggestedParagraphs,
    suggestionsHasError,
    typeAhead,
  } from '../../core/stores/suggestions.store';
  import { tap } from 'rxjs/operators';
  import Label from '../../common/label/Label.svelte';
  import { map, Observable, take } from 'rxjs';
  import type { Classification } from '@nuclia/core';
  import { labelRegexp } from '../../common/label/label.utils';

  export let popupSearch = false;
  export let embeddedSearch = false;
  export let searchBarWidget = false;
  export let placeholder = '';

  const defaultPlaceholder = 'input.placeholder';

  let element: HTMLInputElement;
  const dispatch = createEventDispatcher();

  let inputContainerElement: HTMLElement | undefined;
  let position: DOMRect | undefined;
  let showSuggestions = false;
  const filters = nucliaState().filters.pipe(
    tap((filterQuery) => {
      if (popupSearch) {
        typeAhead.set(filterQuery.join(''));
      }
    }),
  );
  const labels: Observable<Classification[]> = filters.pipe(
    map((filters) =>
      filters
        .map((filter) => {
          const labelMatches = [...filter.matchAll(labelRegexp)];
          if (labelMatches.length === 1) {
            const label = labelMatches[0][1].split('/');
            return { labelset: label[0], label: label[1] };
          }
          return null;
        })
        .filter((label) => !!label),
    ),
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
    position = inputContainerElement?.getBoundingClientRect();
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

  const removeLabel = (label: Classification) => {
    filters.pipe(take(1)).subscribe((filters) => {
      const filterIndex = filters.findIndex((filter) => filter === `LABEL={${label.labelset}/${label.label}}`);
      if (filterIndex > -1) {
        const newFilters = [...filters];
        newFilters.splice(filterIndex, 1);
        nucliaStore().filters.next(newFilters);
      }
    });
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
  <div class="input-container">
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
    <div
      class="search-icon-container"
      class:left-icon={embeddedSearch || searchBarWidget}>
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
    {#if embeddedSearch || searchBarWidget}
      <div class="powered-by">
        <small>Powered by</small>
        <img
          src={`${getCDN()}logos/nuclia-grey.svg`}
          alt="Nuclia" />
      </div>
    {/if}
  </div>

  {#if $filters.length > 0 && (embeddedSearch || searchBarWidget)}
    <div class="filters-container">
      {#each $labels as label (label.label)}
        <Label
          {label}
          removable
          on:remove={() => removeLabel(label)} />
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
      intents={$suggestedIntents} />
  </div>
</Modal>

<style
  lang="scss"
  src="./SearchInput.scss"></style>
