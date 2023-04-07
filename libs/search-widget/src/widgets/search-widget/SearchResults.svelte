<svelte:options tag="nuclia-search-results" />

<script lang="ts">
  import { onMount } from 'svelte';
  import type { Observable } from 'rxjs';
  import { combineLatest, debounceTime, map, merge, Subject } from 'rxjs';
  import { loadFonts, loadSvgSprite } from '../../core/utils';
  import { _ } from '../../core/i18n';
  import LoadingDots from '../../common/spinner/LoadingDots.svelte';
  import globalCss from '../../common/_global.scss?inline';
  import {
    entityRelations,
    hasSearchError,
    isEmptySearchQuery,
    pendingResults,
    smartResults,
    triggerSearch,
    hasMore,
    loadMore,
    searchError,
  } from '../../core/stores/search.store';
  import Tile from '../../tiles/Tile.svelte';
  import InfiniteScroll from '../../common/infinite-scroll/InfiniteScroll.svelte';
  import { fieldData, fieldFullId, resourceTitle } from '../../core/stores/viewer.store';
  import type { Search } from '@nuclia/core';
  import { distinctUntilChanged } from 'rxjs/operators';
  import { isAnswerEnabled, setWidgetActions } from '../../core/stores/widget.store';
  import { onClosePreview } from '../../tiles/tile.utils';
  import InfoCard from '../../components/info-card/InfoCard.svelte';
  import InitialAnswer from '../../components/answer/InitialAnswer.svelte';

  const searchAlreadyTriggered = new Subject<void>();
  const showResults = merge(triggerSearch, searchAlreadyTriggered).pipe(map(() => true));
  const showLoading = pendingResults.pipe(debounceTime(1500));

  const tileResult: Observable<Search.SmartResult | null> = combineLatest([
    fieldFullId.pipe(distinctUntilChanged()),
    fieldData.pipe(distinctUntilChanged()),
    resourceTitle.pipe(distinctUntilChanged()),
  ]).pipe(
    map(([fullId, data, title]) =>
      fullId && data ? ({ id: fullId.resourceId, field: fullId, fieldData: data, title } as Search.SmartResult) : null,
    ),
  );

  export const setTileMenu = setWidgetActions;
  export function closePreview() {
    onClosePreview();
  }

  let svgSprite;

  onMount(() => {
    if (pendingResults.getValue() || smartResults.getValue().length > 0) {
      searchAlreadyTriggered.next();
    }
    loadFonts();
    loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));
  });

  const onLoadMore = () => loadMore.set();
</script>

<svelte:element this="style">{@html globalCss}</svelte:element>
<div
  class="nuclia-widget sw-video-results"
  data-version="__NUCLIA_DEV_VERSION__">
  {#if $showResults && !$isEmptySearchQuery}
    {#if $hasSearchError}
      <div class="error">
        {#if $searchError.status === 402}
          <strong>{$_('error.feature-blocked')}</strong>
        {:else}
          <strong>{$_('error.search')}</strong>
          <span>{$_('error.search-beta')}</span>
        {/if}
      </div>
    {:else if !$pendingResults && $smartResults.length === 0}
      <strong>{$_('results.empty')}</strong>
    {:else}
      <div class="results-container">
        <div
          class="results"
          class:with-relations={$entityRelations.length > 0}>
          {#if $isAnswerEnabled}
            <InitialAnswer />
          {/if}
          {#each $smartResults as result, i (result.id + result.field?.field_type + result.field?.field_id)}
            <Tile {result} />
            {#if i === $smartResults.length - 10}
              <InfiniteScroll
                hasMore={$hasMore}
                on:loadMore={onLoadMore} />
            {/if}
          {/each}
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
