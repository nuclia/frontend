<script lang="ts">
  import type { ExtractedText, Resource } from '@nuclia/core';
  import { getFile } from '../core/api';
  import { nucliaState } from '../core/store';
  import { _ } from '../core/i18n';
  import { findFileByType, search, selectParagraph, viewerStore, viewerState, selectSentence } from './store';
  import { onDestroy } from 'svelte';
  import { combineLatest, filter, of, switchMap } from 'rxjs';
  import Header from './Header.svelte';
  import Paragraphs from './paragraphs/Paragraphs.svelte';
  import InputViewer from './InputViewer.svelte';
  import Metadata from './Metadata.svelte';
  import Preview from './Preview.svelte';

  export let resource: Resource;

  let texts: ExtractedText[] = [];
  let imagePath: string | undefined;
  let image: string | undefined;
  let header: HTMLElement;
  let headerHeight = '0px';

  const query = viewerState.query;
  const paragraphs = viewerState.paragraphs;
  const results = viewerState.results;
  const hasSearchError = viewerState.hasSearchError;
  const showPreview = viewerState.showPreview;

  $: {
    viewerStore.resource.next(resource);
    texts = resource.getExtractedTexts();
    imagePath = findFileByType(resource, 'image/');
    if (imagePath) {
      getFile(imagePath).subscribe((url) => {
        image = url;
      });
    }
  }

  $: headerHeight = header?.clientHeight + 'px' || '0px';

  const subscriptions = [
    nucliaState().displayedResource.subscribe(() => {
      viewerStore.init();
    }),
    viewerState.searchReady
      .pipe(
        switchMap(() => combineLatest([nucliaState().query, nucliaState().displayedResource])),
        filter(
          ([query, displayedResource]) => !!query && (!!displayedResource.paragraph || !!displayedResource.sentence),
        ),
      )
      .subscribe(([query, displayedResource]) => {
        //viewerStore.query.next(query);
        if (displayedResource.sentence) {
          selectSentence(resource, displayedResource.sentence);
        } else if (displayedResource.paragraph) {
          selectParagraph(resource, displayedResource.paragraph);
        }
      }),

    query
      .pipe(switchMap((query) => (query.length > 0 ? search(resource, query) : of(null))))
      .subscribe((paragraphs) => {
        viewerStore.onlySelected.next(false);
        viewerStore.results.next(paragraphs);
      }),
  ];

  onDestroy(() => {
    if (image) URL.revokeObjectURL(image);
    subscriptions.forEach((sub) => sub.unsubscribe());
  });
</script>

<div class="sw-viewer" style="--header-height: {headerHeight}">
  <div class="viewer-header" bind:this={header}>
    <Header {resource} />
  </div>
  <div class="viewer-body" class:preview={$showPreview}>
    <div class="viewer-left">
      <InputViewer />

      <div class="paragraphs">
        {#if $hasSearchError}
          <div><strong>{$_('error.search')}</strong> <span>{$_('error.search-beta')}</span></div>
        {:else if $results}
          <Paragraphs paragraphs={$results} />
        {:else}
          <Paragraphs paragraphs={$paragraphs} />
        {/if}
      </div>

      {#if image}
        <h2>Images</h2>
        <div>
          <img src={image} alt={resource.title + ' preview'} />
        </div>
      {/if}

      <!--
      {#if $query.length === 0 && texts.length > 0}
        <h2>Full text</h2>
        <div>
          {#each texts as text}
            <div>
              <pre>{text.text}</pre>
            </div>
          {/each}
        </div>
      {/if}
      -->
    </div>

    <div class="viewer-right">
      {#if $showPreview}
        <Preview />
      {:else}
        <Metadata {resource} />
      {/if}
    </div>
  </div>
</div>
