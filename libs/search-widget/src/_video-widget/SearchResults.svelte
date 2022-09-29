<svelte:options tag="nuclia-search-results" />

<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { debounceTime, forkJoin, map, switchMap, take } from 'rxjs';
  import { nucliaState, nucliaStore } from '../core/store';
  import { loadFonts, loadSvgSprite } from '../core/utils';
  import { _ } from '../core/i18n';
  import LoadingDots from '../common/spinner/LoadingDots.svelte';
  import VideoTile from './VideoTile.svelte';
  import globalCss from './_global.scss';
  import { fade } from 'svelte/transition';
  import { Duration } from './transition.utils';

  const showResults = nucliaStore().triggerSearch.pipe(map(() => true));
  const results = nucliaState().results;
  const hasSearchError = nucliaState().hasSearchError;
  const pendingResults = nucliaState().pendingResults;
  const showLoading = pendingResults.pipe(debounceTime(2000));
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

  const scrollingListener = () => {
    document.documentElement.style.setProperty('--scroll-y', `${window.scrollY}px`);
  };

  onMount(() => {
    loadFonts();
    loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));

    window.addEventListener('scroll', scrollingListener);
  });

  onDestroy(() => {
    window.removeEventListener('scroll', scrollingListener);
  });

  // Prevent the page to scroll behind the fullscreen expanded tile
  const onFullscreenPreview = () => {
    const scrollY = document.documentElement.style.getPropertyValue('--scroll-y');
    const body = document.body;
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}`;
  }

  const onFullscreenPreviewClosed = () => {
    const body = document.body;
    const scrollY = body.style.top;
    body.style.position = '';
    body.style.top = '';
    setTimeout(() => window.scrollTo(0, parseInt(scrollY || '0') * -1));
  }
</script>

<svelte:element this="style">{@html globalCss}</svelte:element>
<div class="nuclia-widget sw-video-results"
     data-version="__NUCLIA_DEV_VERSION__">
  {#if $showResults}
    {#if $hasSearchError}
      <div class="error">
        <strong>{$_('error.search')}</strong>
        <span>{$_('error.search-beta')}</span>
      </div>
    {:else if $pendingResults}
      {#if $showLoading}
        <LoadingDots />
      {/if}
    {:else if $results.length === 0}
      <strong>{$_('results.empty')}</strong>
    {:else}
      <div class="results"
           transition:fade={{duration: Duration.SUPERFAST}}>
        {#each $paragraphResults as result}
          <VideoTile {result}
                     on:fullscreenPreview={onFullscreenPreview}
                     on:closePreview={onFullscreenPreviewClosed} />
        {/each}
      </div>
    {/if}
  {/if}
  <div id="nuclia-glyphs-sprite" hidden>{@html svgSprite}</div>
</div>

<style lang="scss" src="./SearchResults.scss"></style>
