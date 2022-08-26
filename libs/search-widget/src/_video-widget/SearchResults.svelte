<svelte:options tag="nuclia-search-results"/>

<script lang="ts">
  import type { Resource } from '@nuclia/core';
  import { nucliaState, nucliaStore, setDisplayedResource } from '../core/store';
  import { map, merge, Observable, of, switchMap } from 'rxjs';
  import { onMount } from 'svelte';
  import { getResource } from '../core/api';
  import CloseButton from '../components/button/CloseButton.svelte';
  import { loadCssAsText, loadFonts } from '../core/utils';

  const results = nucliaState().results;
  const showResults = merge(
    nucliaStore().triggerSearch.pipe(map(() => true)),
  );
  let resource: Observable<Resource>;
  let cssVariables;

  onMount(() => {
    loadFonts();
    // Load CSS variables (must be done after the CDN was set) and custom styles
    loadCssAsText().subscribe((css) => cssVariables = css);

    resource = nucliaState().displayedResource.pipe(
      switchMap((resource) => !!resource?.uid ? getResource(resource.uid) : of(null)),
    );
  });

  const closePreview = () => {
    setDisplayedResource({ uid: '' });
  }

</script>

<div class="nuclia-widget nuclia-search-results"
     style="{cssVariables}"
     data-version="__NUCLIA_DEV_VERSION__">
  <div class="results-container">
    {#if $showResults}
      <div class="results"
           class:preview-visible={$resource}>
        <p>TODO: show video results</p>
      </div>
    {/if}

    {#if $resource}
      <div class="viewer-container">
        <p>TODO: show preview from {resource}</p>
        <div class="close-button">
          <CloseButton aspect="basic" on:click={closePreview} />
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .results-container {
    display: flex;
    gap: var(--rhythm-2);
  }
  .results.preview-visible {
    flex: 0 1 auto;
  }
  .viewer-container {
    box-shadow: -1px 0 0 0 var(--color-neutral-regular);
    flex: 1 0 auto;
    max-width: 75%;
    position: relative;
  }
  .close-button {
    position: absolute;
    right: 0;
    top: var(--rhythm-2);
    z-index: 1;
  }
</style>
