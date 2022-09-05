<svelte:options tag="nuclia-search-results"/>

<script lang="ts">
  import { onMount } from 'svelte';
  import { forkJoin, map, switchMap, take } from 'rxjs';
  import { nucliaState, nucliaStore } from '../core/store';
  import { loadCssAsText, loadFonts, loadSvgSprite } from '../core/utils';
  import { _ } from '../core/i18n';
  import LoadingDots from '../components/spinner/LoadingDots.svelte';
  import VideoTile from './VideoTile.svelte';

  const showResults = nucliaStore().triggerSearch.pipe(map(() => true));
  const results = nucliaState().results;
  const hasSearchError = nucliaState().hasSearchError;
  const pendingResults = nucliaState().pendingResults;
  let cssVariables;
  let svgSprite;

  const enhancedResults = results.pipe(
    switchMap((results) =>
      forkJoin(
        results.map((result) =>
          forkJoin([
            nucliaState().getMatchingParagraphs(result.id).pipe(take(1)),
            nucliaState().getMatchingSentences(result.id).pipe(take(1)),
          ]).pipe(
            map(([paragraphs, sentences]) => ({
              resource: result,
              hasParagraphs: paragraphs.length > 0,
              hasSentences: sentences.length > 0,
            })),
          ),
        ),
      ),
    ),
  );
  const paragraphResults = enhancedResults.pipe(
    map((results) => results.filter((result) => result.hasParagraphs).map((result) => result.resource)),
  );

  onMount(() => {
    loadFonts();
    loadSvgSprite().subscribe(sprite => svgSprite = sprite);
    // Load CSS variables (must be done after the CDN was set) and custom styles
    loadCssAsText().subscribe((css) => cssVariables = css);
  });

</script>

<div style="{cssVariables}"
     data-version="__NUCLIA_DEV_VERSION__">
  {#if $showResults}
    {#if $hasSearchError}
      <div class="error">
        <strong>{$_('error.search')}</strong>
        <span>{$_('error.search-beta')}</span>
      </div>
    {:else if $pendingResults}
      <LoadingDots/>
    {:else if $results.length === 0}
      <strong>{$_('results.empty')}</strong>
    {:else}
      <div class="results">
        {#each $paragraphResults as result}
          <VideoTile {result}/>
        {/each}
      </div>
    {/if}
  {/if}
  <div id="nuclia-glyphs-sprite" hidden>{@html svgSprite}</div>
</div>

<style>
  .error {
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: var(--rhythm-2);
    width: var(--search-bar-max-width);
  }

  .results {
    display: flex;
    flex-direction: column;
    gap: var(--rhythm-3);
  }

  :global(mark) {
    background-color: inherit;
    font-weight: var(--font-weight-semi-bold);
  }

  :global(.ellipsis) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
