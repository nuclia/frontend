<svelte:options customElement="nuclia-search-results" />

<script lang="ts">
  import { onMount } from 'svelte';
  import { BehaviorSubject, debounceTime, firstValueFrom } from 'rxjs';
  import { filter, take } from 'rxjs/operators';
  import LoadingDots from '../../common/spinner/LoadingDots.svelte';
  import globalCss from '../../common/_global.scss?inline';
  import {
    _,
    getResultUniqueKey,
    getTrackingDataAfterResultsReceived,
    hasMore,
    hasPartialResults,
    hasSearchError,
    hideResults,
    isAnswerEnabled,
    isEmptySearchQuery,
    loadFonts,
    loadMore,
    loadSvgSprite,
    logEvent,
    pendingResults,
    resultList,
    searchError,
    setWidgetActions,
    showResults,
    trackingReset,
  } from '../../core';
  import InfiniteScroll from '../../common/infinite-scroll/InfiniteScroll.svelte';
  import { InitialAnswer, onClosePreview, ResultRow, Viewer } from '../../components';
  import { injectCustomCss } from '../../core/utils';

  export let cssPath = '';
  export let mode = '';
  export let scrollableContainerSelector = '';
  export let no_tracking = false;
  $: darkMode = mode === 'dark';

  const showLoading = pendingResults.pipe(debounceTime(1500));

  export const setViewerMenu = setWidgetActions;

  export function closePreview() {
    onClosePreview();
  }
  let _ready = new BehaviorSubject(false);
  const ready = _ready.asObservable().pipe(filter((r) => r));
  export const onReady = () => firstValueFrom(ready);

  let svgSprite: string;
  let container: HTMLElement;

  onMount(() => {
    if (pendingResults.getValue() || resultList.getValue().length > 0) {
      showResults.set(true);
    }
    loadFonts();
    loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));
    injectCustomCss(cssPath, container);
    _ready.next(true);
  });

  function renderingDone(node: HTMLElement) {
    if (!no_tracking) {
      getTrackingDataAfterResultsReceived.pipe(take(1)).subscribe((tracking) => {
        const tti = Date.now() - tracking.startTime;
        logEvent('search', {
          searchId: tracking.searchId || '',
          tti,
        });
        trackingReset.set(undefined);
      });
    }
  }

  const onLoadMore = () => loadMore.set();
</script>

<svelte:element this="style">{@html globalCss}</svelte:element>

<div
  bind:this={container}
  class="nuclia-widget sw-video-results"
  class:dark-mode={darkMode}
  data-version="__NUCLIA_DEV_VERSION__">
  {#if $showResults && !$isEmptySearchQuery}
    {#if $hasSearchError && !$hasPartialResults}
      <div class="error">
        {#if $searchError?.status === 402}
          <strong>{$_('error.feature-blocked')}</strong>
        {:else}
          <strong>{$_('error.search')}</strong>
        {/if}
      </div>
    {:else if !$pendingResults && $resultList.length === 0 && !$hideResults}
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
        <div class="results">
          {#if $isAnswerEnabled}
            <InitialAnswer />
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
                {scrollableContainerSelector}
                on:loadMore={onLoadMore} />
            {/if}
          </div>
        </div>
      </div>
      {#if $showLoading}
        <LoadingDots />
      {/if}
    {/if}
  {/if}

  <Viewer />

  <div
    id="nuclia-glyphs-sprite"
    hidden>
    {@html svgSprite}
  </div>
</div>

<style
  lang="scss"
  src="./SearchResults.scss"></style>
