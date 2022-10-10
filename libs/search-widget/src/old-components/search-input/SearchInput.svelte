<script lang="ts">
  import { _ } from '../../core/i18n';
  import { createEventDispatcher, onMount } from 'svelte';
  import { nucliaStore } from '../../core/old-stores/main.store';
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


  onMount(() => {
    setInputPosition();
  });

  const setInputPosition = () => {
    position = inputContainerElement?.getBoundingClientRect();
  }

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
  }
</script>

<svelte:window on:resize={setInputPosition}/>
<form role="search"
      autocomplete="off"
      class="sw-search-input"
      class:search-bar-container={embeddedSearch || searchBarWidget}
      bind:this={inputContainerElement}
>
  <input bind:this={element}
         class="search-field"
         class:input-widget={popupSearch}
         class:embedded-search={embeddedSearch}
         class:search-bar-widget={searchBarWidget}
         name="nuclia-search-field"
         placeholder={$_(placeholder || defaultPlaceholder)}
         tabindex="0"
         autocomplete="off"
         autocapitalize="off"
         spellcheck="false"
         aria-label="Search input"
         bind:value={$typeAhead}
         on:keypress={onKeyPress}
  />
  <div class="search-icon-container"
       class:left-icon={embeddedSearch || searchBarWidget}>
    <div class="search-icon"
         tabIndex="0"
         on:click={search}
         on:keyup={(e) => {
            if (e.key === 'Enter') {
              search();
            }
          }}>
      <Icon name="search"/>
    </div>
  </div>
  {#if embeddedSearch || searchBarWidget}
    <div class="powered-by">
      <small>Powered by</small>
      <img src={`${getCDN()}logos/nuclia-grey.svg`} alt="Nuclia"/>
    </div>
  {/if}
</form>
<Modal show={showSuggestions && ($hasSuggestions || $suggestionsHasError)}
       popup={true}
       parentPosition={position}
       on:close={closeSuggestions}
>
  <div class="sw-suggestions">
    <Suggestions paragraphs={$suggestedParagraphs}
                 intents={$suggestedIntents}/>
  </div>
</Modal>


<style lang="scss" src="./SearchInput.scss"></style>
