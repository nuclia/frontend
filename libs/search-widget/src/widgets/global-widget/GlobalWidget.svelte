<svelte:options
  customElement={{
    tag: 'nuclia-global-search',
    props: {
      kbstate: { attribute: 'state' },
    },
  }}
  accessors />

<script lang="ts">
  import type { KBStates, WidgetFeatures } from '@nuclia/core';
  import { debounceTime } from 'rxjs';
  import { take } from 'rxjs/operators';
  import { createEventDispatcher, onMount } from 'svelte';
  import { InfiniteScroll, LoadingDots } from '../../common';
  import globalCss from '../../common/_global.scss?inline';
  import { logEvent } from '../../core';
  import { getApiErrors, initNuclia, resetNuclia } from '../../core/api';
  import { _, setLang } from '../../core/i18n';
  import { setupTriggerSearch } from '../../core/search-bar';
  import {
    activatePermalinks,
    activateTypeAheadSuggestions,
    initAnswer,
    initUsageTracking,
  } from '../../core/stores/effects';
  import {
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
  import { isAnswerEnabled, widgetFeatures, widgetPlaceholder } from '../../core/stores/widget.store';
  import { loadFonts, loadSvgSprite, setCDN } from '../../core/utils';
  import { InitialAnswer, ResultRow, SearchInput } from './components';

  interface Props {
    backend?: string;
    zone?: string;
    knowledgebox: string;
    placeholder?: string;
    lang?: string;
    cdn?: string;
    apikey?: string;
    account?: string;
    client?: string;
    kbstate?: KBStates;
    features?: string;
    standalone?: boolean;
    mode?: string;
    vectorset?: string;
    audit_metadata?: string;
    copy_disclaimer?: string | undefined;
    metadata?: string | undefined;
  }

  let {
    backend = 'https://nuclia.cloud/api',
    zone = 'europe-1',
    knowledgebox,
    placeholder = '',
    lang = $bindable(''),
    cdn = '',
    apikey = '',
    account = '',
    client = 'widget',
    kbstate = 'PUBLISHED',
    features = '',
    standalone = false,
    mode = '',
    vectorset = '',
    audit_metadata = '',
    copy_disclaimer = undefined,
    metadata = undefined,
  }: Props = $props();

  let darkMode = $derived(mode === 'dark');

  let _features: WidgetFeatures = {};

  export function search(query: string, doNotTriggerSearch = false) {
    searchQuery.set(query);
    typeAhead.set(query || '');
    if (!doNotTriggerSearch) {
      triggerSearch.next();
    }
  }

  export function reloadSearch() {
    console.log(`reloadSearch`);
    triggerSearch.next();
  }

  export const onError = getApiErrors();

  const dispatch = createEventDispatcher();
  const dispatchCustomEvent = (name: string, detail: any) => {
    dispatch(name, detail);
  };

  const showLoading = pendingResults.pipe(debounceTime(500));
  let svgSprite: string = $state();
  let ready = $state(false);
  let visible = $state(false);
  let answerHeight: number = $state();

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
        standalone,
        account,
      },
      kbstate,
      {
        features: _features,
        vectorset,
        audit_metadata,
        copy_disclaimer,
        metadata,
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

    if (_features.suggestions || _features.autocompleteFromNERs) {
      activateTypeAheadSuggestions();
    }

    lang = lang || window.navigator.language.split('-')[0] || 'en';
    setLang(lang);

    setupTriggerSearch(dispatchCustomEvent);
    if (_features.permalink) {
      activatePermalinks();
    }
    initUsageTracking();

    const globalSearchButtons = document.querySelectorAll('[data-nuclia="global-search-button"]');
    if (globalSearchButtons.length > 0) {
      globalSearchButtons.forEach((button) => button.addEventListener('click', toggleSearchVisibility));
    } else {
      console.error(
        `No button found to open Nuclia’s global search. Make sure you added 'data-nuclia="global-search-button"' to your search button.`,
      );
    }

    ready = true;

    if (pendingResults.getValue() || resultList.getValue().length > 0) {
      showResults.set(true);
    }
    return () => {
      if (globalSearchButtons.length > 0) {
        globalSearchButtons.forEach((button) => button.removeEventListener('click', toggleSearchVisibility));
      }
      resetNuclia();
    };
  });

  function renderingDone(node: HTMLElement) {
    const tracking = getTrackingDataAfterResultsReceived.pipe(take(1)).subscribe((tracking) => {
      const tti = Date.now() - tracking.startTime;
      logEvent('search', {
        searchId: tracking.searchId || '',
        tti,
      });
      trackingReset.set(undefined);
    });
    return {
      destroy: () => tracking.unsubscribe(),
    };
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

<svelte:element this={'style'}>{@html globalCss}</svelte:element>
<div
  class="nuclia-widget"
  class:dark-mode={darkMode}
  data-version="__NUCLIA_DEV_VERSION__">
  {#if ready && !!svgSprite && visible}
    <div
      class="backdrop"
      onkeyup={onBackdropKeyup}
      onclick={onBackdropClick}>
      <div
        class="search-container"
        class:with-results={$showResults && !$isEmptySearchQuery}>
        <div class="search-bar-container">
          <SearchInput />
        </div>

        <div class="search-results-container">
          {#if $showResults && !$isEmptySearchQuery}
            {#if $hasPartialResults}
              <div class="partial-results-warning">
                <strong>{$_('error.partial-results')}</strong>
              </div>
            {/if}
            <div class="results-container">
              <div class="results">
                {#if $isAnswerEnabled}
                  <div bind:offsetHeight={answerHeight}>
                    <InitialAnswer />
                  </div>
                {/if}
                {#if $hasSearchError && !$hasPartialResults}
                  <div class="error">
                    {#if $searchError?.status === 402}
                      <strong>{$_('error.feature-blocked')}</strong>
                    {:else}
                      <strong>{$_('error.search')}</strong>
                    {/if}
                  </div>
                {:else if !$pendingResults && $resultList.length === 0 && !$isAnswerEnabled}
                  <strong>{$_('results.empty')}</strong>
                  <div
                    class="results-end"
                    use:renderingDone>
                  </div>
                {:else if $resultList.length > 0}
                  <div class="search-results">
                    {#each $resultList as result, i (getResultUniqueKey(result))}
                      <ResultRow {result} />
                      {#if i === $resultList.length - 1}
                        <div
                          class="results-end"
                          use:renderingDone>
                        </div>
                      {/if}
                    {/each}
                    {#if $hasMore}
                      <InfiniteScroll
                        hasMore={$hasMore}
                        on:loadMore={onLoadMore} />
                    {/if}
                  </div>
                {/if}
              </div>
            </div>
            {#if $showLoading}
              <LoadingDots />
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

<style src="./GlobalWidget.css"></style>
