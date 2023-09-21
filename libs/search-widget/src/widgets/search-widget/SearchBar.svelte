<svelte:options tag="nuclia-global-search" />

<script lang="ts">
  import type { KBStates, WidgetFeatures } from '@nuclia/core';
  import { initNuclia, resetNuclia } from '../../core/api';
  import { onMount } from 'svelte';
  import { loadFonts, loadSvgSprite, setCDN } from '../../core/utils';
  import { _, setLang } from '../../core/i18n';
  import SearchInput from '../../components/search-input/SearchInput.svelte';
  import { setupTriggerSearch } from '../../core/search-bar';
  import globalCss from '../../common/_global.scss?inline';
  import { get_current_component } from 'svelte/internal';
  import { isAnswerEnabled, onlyAnswers, widgetFeatures, widgetPlaceholder } from '../../core/stores/widget.store';
  import {
    activatePermalinks,
    activateTypeAheadSuggestions,
    initAnswer,
    initUsageTracking,
    resetStatesAndEffects,
  } from '../../core/stores/effects';
  import {
    entityRelations,
    getResultUniqueKey,
    getTrackingDataAfterResultsReceived,
    hasMore,
    hasPartialResults,
    hasSearchError,
    isEmptySearchQuery,
    loadMore,
    pendingResults,
    resultList,
    searchError,
    searchQuery,
    showResults,
    trackingReset,
    triggerSearch,
  } from '../../core/stores/search.store';
  import { typeAhead } from '../../core/stores/suggestions.store';
  import { take } from 'rxjs/operators';
  import { logEvent } from '../../core';
  import LoadingDots from '../../common/spinner/LoadingDots.svelte';
  import { InfoCard, InitialAnswer, ResultRow } from '../../components';
  import InfiniteScroll from '../../common/infinite-scroll/InfiniteScroll.svelte';
  import { debounceTime } from 'rxjs';

  export let backend = 'https://nuclia.cloud/api';
  export let zone = 'europe-1';
  export let knowledgebox: string;
  export let placeholder = '';
  export let lang = '';
  export let cdn = '';
  export let apikey = '';
  export let kbslug = '';
  export let account = '';
  export let client = 'widget';
  export let state: KBStates = 'PUBLISHED';
  export let features = '';
  export let standalone = false;
  export let mode = '';

  $: darkMode = mode === 'dark';

  let _features: WidgetFeatures = {};

  export function search(query: string) {
    searchQuery.set(query);
    typeAhead.set(query || '');
    triggerSearch.next();
  }

  export function reloadSearch() {
    console.log(`reloadSearch`);
    triggerSearch.next();
  }

  const thisComponent = get_current_component();
  const dispatchCustomEvent = (name: string, detail: any) => {
    thisComponent.dispatchEvent &&
      thisComponent.dispatchEvent(
        new CustomEvent(name, {
          detail,
          composed: true,
        }),
      );
  };

  const showLoading = pendingResults.pipe(debounceTime(1500));
  let svgSprite: string;
  let ready = false;
  let visible = false;
  let answerHeight: number;

  onMount(() => {
    if (cdn) {
      setCDN(cdn);
    }
    _features = (features ? features.split(',').filter((feature) => !!feature) : []).reduce(
      (acc, current) => ({ ...acc, [current as keyof WidgetFeatures]: true }),
      {},
    );

    initNuclia(
      {
        backend,
        zone,
        knowledgeBox: knowledgebox,
        client,
        apiKey: apikey,
        kbSlug: kbslug,
        standalone,
        account,
      },
      state,
      {
        highlight: true,
        features: _features,
      },
    );

    // Setup widget in the store
    widgetFeatures.set(_features);
    if (placeholder) {
      widgetPlaceholder.set(placeholder);
    }

    if (_features.answers) {
      initAnswer();
    }
    loadFonts();
    loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));

    if (_features.suggestions || _features.suggestEntities) {
      activateTypeAheadSuggestions();
    }

    lang = lang || window.navigator.language.split('-')[0] || 'en';
    setLang(lang);

    setupTriggerSearch(dispatchCustomEvent);
    if (_features.permalink) {
      activatePermalinks();
    }
    initUsageTracking();

    const globalSearchButton = document.querySelector('[data-nuclia="global-search-button"]');
    if (globalSearchButton) {
      globalSearchButton.addEventListener('click', toggleSearchVisibility);
    } else {
      console.error(`No button found to open Nuclia’s global search. Make sure you added 'data-nuclia="global-search-button"' to your search button.`);
    }

    ready = true;

    if (pendingResults.getValue() || resultList.getValue().length > 0) {
      showResults.set(true);
    }
    return () => {
      if (globalSearchButton) {
        globalSearchButton.removeEventListener('click', toggleSearchVisibility);
      }
      resetNuclia();
      resetStatesAndEffects();
    };
  });

  function renderingDone(node: HTMLElement) {
    getTrackingDataAfterResultsReceived.pipe(take(1)).subscribe((tracking) => {
      const tti = Date.now() - tracking.startTime;
      logEvent('search', {
        searchId: tracking.searchId || '',
        tti,
      });
      trackingReset.set(undefined);
    });
  }
  function toggleSearchVisibility() {
    visible = !visible;
  }

  function onBackdropKeyup(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      toggleSearchVisibility();
    }
  }

  function onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('backdrop')) {
      toggleSearchVisibility();
    }
  }

  function onLoadMore() {
    loadMore.set();
  }
</script>

<svelte:element this="style">{@html globalCss}</svelte:element>
<div
  class="nuclia-widget"
  class:dark-mode={darkMode}
  data-version="__NUCLIA_DEV_VERSION__">
  {#if ready && !!svgSprite && visible}
    <div class="backdrop"
         on:keyup={onBackdropKeyup}
         on:click={onBackdropClick}>
      <div class="search-container"
           class:with-results={$showResults && !$isEmptySearchQuery}>
        <div class="search-bar-container">
          <SearchInput />
        </div>

        <div class="search-results-container">
          {#if $showResults && !$isEmptySearchQuery}
            {#if $hasSearchError && !$hasPartialResults}
              <div class="error">
                {#if $searchError?.status === 402}
                  <strong>{$_('error.feature-blocked')}</strong>
                {:else}
                  <strong>{$_('error.search')}</strong>
                {/if}
              </div>
            {:else if !$pendingResults && $resultList.length === 0 && !$onlyAnswers}
              <strong>{$_('results.empty')}</strong>
              <div
                class="results-end"
                use:renderingDone />
            {:else}
              {#if $hasPartialResults}
                <div class="partial-results-warning">
                  <strong>{$_('error.partial-results')}</strong>
                </div>
              {/if}
              <div class="results-container">
                <div
                  class="results"
                  class:with-relations={$entityRelations.length > 0}>
                  {#if $isAnswerEnabled}
                    <div bind:offsetHeight={answerHeight}>
                      <InitialAnswer />
                    </div>
                  {/if}
                  <div class="search-results">
                    {#each $resultList as result, i (getResultUniqueKey(result))}
                      <ResultRow {result} />
                      {#if i === $resultList.length - 1}
                        <div
                          class="results-end"
                          use:renderingDone />
                      {/if}
                    {/each}
                    {#if $hasMore}
                      <InfiniteScroll
                        hasMore={$hasMore}
                        on:loadMore={onLoadMore} />
                    {/if}
                  </div>
                </div>
                {#if $entityRelations.length > 0}
                  <InfoCard entityRelations={$entityRelations} />
                {/if}
              </div>
              {#if $showLoading}
                <LoadingDots />
              {/if}
            {/if}
          {/if}
        </div>
      </div>
    </div>

  {/if}
  <div
    id="nuclia-glyphs-sprite"
    hidden>
    {@html svgSprite}
  </div>
</div>

<style
  lang="scss"
  src="./SearchBar.scss">
</style>
