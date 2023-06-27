<svelte:options tag="nuclia-search-results" />

<script lang="ts">
  import { onMount } from 'svelte';
  import type { Observable } from 'rxjs';
  import { combineLatest, debounceTime, map } from 'rxjs';
  import { loadFonts, loadSvgSprite } from '../../core/utils';
  import { _ } from '../../core/i18n';
  import LoadingDots from '../../common/spinner/LoadingDots.svelte';
  import globalCss from '../../common/_global.scss?inline';
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
    searchError,
    showResults,
    resultList,
    trackingReset,
  } from '../../core/stores/search.store';
  import Tile from '../../tiles/Tile.svelte';
  import InfiniteScroll from '../../common/infinite-scroll/InfiniteScroll.svelte';
  import { fieldData, fieldFullId, resourceTitle } from '../../core/stores/viewer.store';
  import type { Search } from '@nuclia/core';
  import { distinctUntilChanged, take } from 'rxjs/operators';
  import { isAnswerEnabled, onlyAnswers, setWidgetActions } from '../../core/stores/widget.store';
  import { onClosePreview } from '../../tiles/tile.utils';
  import InfoCard from '../../components/info-card/InfoCard.svelte';
  import InitialAnswer from '../../components/answer/InitialAnswer.svelte';
  import { logEvent } from '../../core/tracking';


  export let mode = '';
  $: darkMode = mode === 'dark';

  const showLoading = pendingResults.pipe(debounceTime(1500));

  const tileResult: Observable<Search.FieldResult | null> = combineLatest([
    fieldFullId.pipe(distinctUntilChanged()),
    fieldData.pipe(distinctUntilChanged()),
    resourceTitle.pipe(distinctUntilChanged()),
  ]).pipe(
    map(([fullId, data, title]) =>
      fullId && data ? ({ id: fullId.resourceId, field: fullId, fieldData: data, title } as Search.FieldResult) : null,
    ),
  );

  export const setTileMenu = setWidgetActions;
  export function closePreview() {
    onClosePreview();
  }

  let svgSprite;

  onMount(() => {
    if (pendingResults.getValue() || resultList.getValue().length > 0) {
      showResults.set(true);
    }
    loadFonts();
    loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));
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

  const onLoadMore = () => loadMore.set();
</script>

<svelte:element this="style">{@html globalCss}</svelte:element>
<div
  class="nuclia-widget sw-video-results"
  class:dark-mode={darkMode}
  data-version="__NUCLIA_DEV_VERSION__">
  {#if $showResults && !$isEmptySearchQuery}
    {#if $hasSearchError && !$hasPartialResults}
      <div class="error">
        {#if $searchError.status === 402}
          <strong>{$_('error.feature-blocked')}</strong>
        {:else}
          <strong>{$_('error.search')}</strong>
        {/if}
      </div>
    {:else if !$pendingResults && $resultList.length === 0 && !$onlyAnswers}
      <strong>{$_('results.empty')}</strong>
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
            <InitialAnswer />
          {/if}
          <div class="search-results">
            {#each $resultList as result, i (getResultUniqueKey(result))}
              <Tile {result} />
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
  {:else if $tileResult}
    <Tile result={$tileResult} />
  {/if}

  <div
    id="nuclia-glyphs-sprite"
    hidden>
    {@html svgSprite}
  </div>
</div>

<style
  lang="scss"
  src="./SearchResults.scss"></style>
