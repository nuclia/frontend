<script lang="ts">
  import { _ } from '../../../../core/i18n';
  import { createEventDispatcher, onMount } from 'svelte';
  import Icon from '../../../../common/icons/Icon.svelte';
  import Modal from '../../../../common/modal/Modal.svelte';
  import Suggestions from '../suggestions/Suggestions.svelte';
  import {
    hasSuggestions,
    suggestedParagraphs,
    suggestionsHasError,
    suggestionState,
    triggerSuggestions,
    typeAhead,
  } from '../../../../core/stores/suggestions.store';
  import IconButton from '../../../../common/button/IconButton.svelte';
  import { widgetPlaceholder } from '../../../../core/stores/widget.store';
  import { searchQuery, triggerSearch } from '../../../../core/stores/search.store';

  let searchInputElement: HTMLInputElement;
  const dispatch = createEventDispatcher();

  let inputContainerElement: HTMLElement | undefined;
  let position: DOMRect | undefined;
  let showSuggestions = false;

  let suggestionModalWidth: string;
  $: {
    if (inputContainerElement) {
      suggestionModalWidth = `${inputContainerElement.offsetWidth}px`;
    }
  }

  onMount(() => {
    searchInputElement?.focus();
  });

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

  function clear() {
    suggestionState.reset();
    searchQuery.set('');
  }
</script>

<svelte:window on:resize={setInputPosition} />
<form
  role="search"
  autocomplete="off"
  class="sw-search-input search-bar-widget"
  bind:this={inputContainerElement}>

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
  </div>
</form>


<Modal
  show={showSuggestions && ($hasSuggestions || $suggestionsHasError)}
  popup={true}
  parentPosition={position}
  modalWidth={suggestionModalWidth}
  on:close={closeSuggestions}>
  <div class="sw-suggestions-container">
    <Suggestions
      on:search={() => search()}
      paragraphs={$suggestedParagraphs} />
  </div>
</Modal>

<style
  lang="scss"
  src="./SearchInput.scss"></style>
