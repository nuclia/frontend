<svelte:options tag="nuclia-search-results" />

<script lang="ts">
  import { onMount } from 'svelte';
  import { debounceTime, map, merge, of, shareReplay, Subject, switchMap } from 'rxjs';
  import { loadFonts, loadSvgSprite } from '../../core/utils';
  import { _ } from '../../core/i18n';
  import LoadingDots from '../../common/spinner/LoadingDots.svelte';
  import globalCss from '../../common/_global.scss?inline';
  import {
    entityRelations,
    displayedResource,
    hasSearchError,
    isEmptySearchQuery,
    pendingResults,
    smartResults,
    triggerSearch,
  } from '../../core/stores/search.store';
  import { getResourceById } from '../../core/api';
  import Tile from './Tile.svelte';
  import { ResourceProperties } from '@nuclia/core';

  const searchAlreadyTriggered = new Subject<void>();
  const showResults = merge(triggerSearch, searchAlreadyTriggered).pipe(map(() => true));
  const showLoading = pendingResults.pipe(debounceTime(2000));
  const resource = displayedResource.pipe(
    switchMap((data) => (data?.uid ? getResourceById(data.uid, [ResourceProperties.BASIC]) : of(null))),
    shareReplay(),
  );

  let svgSprite;

  onMount(() => {
    if (pendingResults.getValue() || smartResults.getValue().length > 0) {
      searchAlreadyTriggered.next();
    }
    loadFonts();
    loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));
  });
</script>

<svelte:element this="style">{@html globalCss}</svelte:element>
<div
  class="nuclia-widget sw-video-results"
  data-version="__NUCLIA_DEV_VERSION__">
  {#if $showResults && !$isEmptySearchQuery}
    {#if $hasSearchError}
      <div class="error">
        <strong>{$_('error.search')}</strong>
        <span>{$_('error.search-beta')}</span>
      </div>
    {:else if $pendingResults}
      {#if $showLoading}
        <LoadingDots />
      {/if}
    {:else if $smartResults.length === 0}
      <strong>{$_('results.empty')}</strong>
    {:else}
      <div class="results-container">
        <div
          class="results"
          class:with-relations={$entityRelations.length > 0}>
          {#each $smartResults as result}
            <Tile {result} />
          {/each}
        </div>
        {#if $entityRelations.length > 0}
          <div class="relations">
            {#each $entityRelations as entity}
              <div class="entity">
                <div class="entity-name">{entity.entity}</div>
                {#each Object.entries(entity.relations) as [name, related]}
                  <div class="relation">
                    <span class="relation-name">{name}:</span>
                    <span>{related.join(',')}</span>
                  </div>
                {/each}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  {/if}
  {#if $displayedResource && $resource}
    <Tile result={$resource} />
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
