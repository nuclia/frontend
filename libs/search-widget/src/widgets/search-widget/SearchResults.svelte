<svelte:options customElement="nuclia-search-results" />

<script lang="ts">
  import { onMount } from 'svelte';
  import { BehaviorSubject, debounceTime, firstValueFrom } from 'rxjs';
  import { filter, take } from 'rxjs/operators';
  import LoadingDots from '../../common/spinner/LoadingDots.svelte';
  import globalCss from '../../common/_global.scss?inline';
  import {
    _,
    debug,
    collapseTextBlocks,
    downloadDump,
    getResultUniqueKey,
    getTrackingDataAfterResultsReceived,
    hasMore,
    hasPartialResults,
    hasSearchError,
    hideResults,
    isAnswerEnabled,
    isEmptySearchQuery,
    jsonAnswer,
    jsonSchemaEnabled,
    loadFonts,
    loadMore,
    loadSvgSprite,
    logEvent,
    pendingResults,
    resultList,
    searchError,
    showResults,
    trackingReset,
    type WidgetAction,
    widgetActions,
    widgetJsonSchema,
    rephrasedQuery,
    hasSortButton,
  } from '../../core';
  import InfiniteScroll from '../../common/infinite-scroll/InfiniteScroll.svelte';
  import { DebugInfo, InitialAnswer, JsonAnswer, onClosePreview, ResultRow, Viewer } from '../../components';
  import { injectCustomCss } from '../../core/utils';
  import { Button, IconButton } from '../../common';
  import ResultsOrderButton from '../../components/results-order/ResultsOrderButton.svelte';

  interface Props {
    csspath?: string;
    mode?: string;
    scrollableContainerSelector?: string;
    no_tracking?: boolean;
  }

  let { csspath = '', mode = '', scrollableContainerSelector = '', no_tracking = false }: Props = $props();
  let darkMode = $derived(mode === 'dark');

  const showLoading = pendingResults.pipe(debounceTime(500));

  widgetActions.set([]);
  export function setViewerMenu(actions: WidgetAction[]) {
    widgetActions.set(actions);
  }

  export function closePreview() {
    onClosePreview();
  }
  let _ready = new BehaviorSubject(false);
  const ready = _ready.asObservable().pipe(filter((r) => r));
  export const onReady = () => firstValueFrom(ready);

  let svgSprite: string = $state();
  let container: HTMLElement = $state();
  let showMetadata = $state(false);

  onMount(() => {
    if (pendingResults.getValue() || resultList.getValue().length > 0) {
      showResults.set(true);
    }
    loadFonts();
    loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));
    injectCustomCss(csspath, container);
    _ready.next(true);
  });

  function renderingDone(node: HTMLElement) {
    if (!no_tracking) {
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
  }

  const onLoadMore = () => loadMore.set();
</script>

<svelte:element this={'style'}>{@html globalCss}</svelte:element>

<div
  bind:this={container}
  class="nuclia-widget sw-video-results"
  class:dark-mode={darkMode}
  data-version="__NUCLIA_DEV_VERSION__">
  {#if $showResults && !$isEmptySearchQuery}
    {#if $hasPartialResults}
      <div class="partial-results-warning">
        <strong>{$_('error.partial-results')}</strong>
      </div>
    {/if}
    <div class="results-container">
      <div class="results">
        {#if $isAnswerEnabled}
          <InitialAnswer />
          {#if $jsonSchemaEnabled && $jsonAnswer}
            <JsonAnswer
              jsonAnswer={$jsonAnswer}
              jsonSchema={$widgetJsonSchema} />
          {/if}
        {/if}
        {#if !$isAnswerEnabled && $debug}
          <div class="actions">
            {#if $rephrasedQuery}
              <div>
                <IconButton
                  aspect="basic"
                  icon="info"
                  size="small"
                  kind="secondary"
                  on:click={() => (showMetadata = true)} />
                <DebugInfo
                  rephrasedQuery={$rephrasedQuery}
                  bind:show={showMetadata} />
              </div>
            {/if}
            <Button
              aspect="basic"
              size="small"
              on:click={() => downloadDump()}>
              <span>{$_('answer.download-log')}</span>
            </Button>
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
          <div>
            <h3 class="title-s">
              {$_('results.title')}
              {#if $hasSortButton}
                <div class="sort">
                  <ResultsOrderButton></ResultsOrderButton>
                </div>
              {/if}
            </h3>
            <div
              class="search-results"
              class:collapsed={$collapseTextBlocks}>
              {#each $resultList as result, i (getResultUniqueKey(result))}
                <ResultRow
                  {result}
                  answerRank={0} />
                {#if i === $resultList.length - 1}
                  <div
                    class="results-end"
                    use:renderingDone>
                  </div>
                {/if}
              {/each}
              {#if $hasMore && !$hideResults}
                <InfiniteScroll
                  hasMore={$hasMore}
                  {scrollableContainerSelector}
                  on:loadMore={onLoadMore} />
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>
    {#if $showLoading}
      <LoadingDots />
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
