<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import IconButton from '../../../../common/button/IconButton.svelte';
  import Icon from '../../../../common/icons/Icon.svelte';
  import Modal from '../../../../common/modal/Modal.svelte';
  import Textarea from '../../../../common/textarea/Textarea.svelte';
  import { _ } from '../../../../core/i18n';
  import { searchQuery, triggerSearch } from '../../../../core/stores/search.store';
  import {
    hasSuggestions,
    suggestedParagraphs,
    suggestionsHasError,
    suggestionState,
    triggerSuggestions,
    typeAhead,
  } from '../../../../core/stores/suggestions.store';
  import { widgetPlaceholder } from '../../../../core/stores/widget.store';
  import Suggestions from '../suggestions/Suggestions.svelte';

  let searchInputElement: HTMLInputElement = $state();
  const dispatch = createEventDispatcher();

  let inputContainerElement: HTMLElement | undefined = $state();
  let showSuggestions = $state(false);

  onMount(() => {
    searchInputElement?.focus();
  });

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
      search();
      showSuggestions = false;
    } else {
      showSuggestions = true;
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
    <Textarea
      bind:this={searchInputElement}
      name="nuclia-search-field"
      placeholder={$_($widgetPlaceholder)}
      tabindex="0"
      ariaLabel="Search input"
      bind:value={$typeAhead}
      on:input={() => triggerSuggestions.next()}
      on:keypress={onKeyPress} />
  </div>
</form>

<Modal
  show={showSuggestions && ($hasSuggestions || $suggestionsHasError)}
  popup={true}
  parentElement={inputContainerElement}
  on:close={closeSuggestions}>
  <div class="sw-suggestions-container">
    <Suggestions
      on:search={() => search()}
      paragraphs={$suggestedParagraphs} />
  </div>
</Modal>

<style src="./SearchInput.css"></style>
