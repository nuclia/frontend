<svelte:options tag="nuclia-search-results" />

<script lang="ts">
  import { onMount } from 'svelte';
  import { debounceTime, map } from 'rxjs';
  import { nucliaState, nucliaStore } from '../../core/old-stores/main.store';
  import { loadFonts, loadSvgSprite } from '../../core/utils';
  import { _ } from '../../core/i18n';
  import LoadingDots from '../../common/spinner/LoadingDots.svelte';
  import VideoTile from '../../tiles/video-tile/VideoTile.svelte';
  import globalCss from '../../common/_global.scss';
  import { fade } from 'svelte/transition';
  import { Duration } from '../../common/transition.utils';
  import PdfTile from '../../tiles/pdf-tile/PdfTile.svelte';

  const showResults = nucliaStore().triggerSearch.pipe(map(() => true));
  const hasQuery = nucliaState().query.pipe(map((query) => !!query));
  const results = nucliaState().smartResults;
  const hasSearchError = nucliaState().hasSearchError;
  const pendingResults = nucliaState().pendingResults;
  const showLoading = pendingResults.pipe(debounceTime(2000));
  let svgSprite;

  onMount(() => {
    loadFonts();
    loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));
  });
</script>

<svelte:element this="style">{@html globalCss}</svelte:element>
<div
  class="nuclia-widget sw-video-results"
  data-version="__NUCLIA_DEV_VERSION__">
  {#if $showResults && $hasQuery}
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
      <div
        class="results"
        transition:fade={{ duration: Duration.SUPERFAST }}>
        {#each $results as result}
          {#if result.icon === 'application/pdf'}
            <PdfTile {result} />
          {:else}
            <VideoTile {result} />
          {/if}
        {/each}
      </div>
    {/if}
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
