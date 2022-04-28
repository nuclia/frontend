<script lang="ts">
  import type { ExtractedText, Resource } from '@nuclia/core';
  import { getFile } from '../core/api';
  import { nucliaState } from '../core/store';
  import { _ } from '../core/i18n';
  import { findFileByType, search, getResourceParagraphs, selectParagraph, viewerStore, viewerState } from './store';
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
  let showSelectedParagraph = false;

  const query = viewerState.query;
  const paragraphs = viewerState.paragraphs;
  const results = viewerState.results;
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

  const subscriptions = [
    nucliaState().displayedResource.subscribe(() => {
      viewerStore.init();
    }),
    viewerState.searchReady.subscribe(() => {
      viewerStore.paragraphs.next(getResourceParagraphs(resource));
    }),
    viewerState.searchReady
      .pipe(
        switchMap(() => combineLatest([nucliaState().query, nucliaState().displayedResource])),
        filter(([query, displayedResource]) => !!query && !!displayedResource.paragraph),
      )
      .subscribe(([query, displayedResource]) => {
        //viewerStore.query.next(query);
        showSelectedParagraph = true;
        selectParagraph(resource, displayedResource.paragraph);
      }),
    query
      .pipe(switchMap((query) => (query.length > 0 ? search(resource, query) : of(null))))
      .subscribe((paragraphs) => {
        viewerStore.results.next(paragraphs);
      }),
  ];

  const showAllParagraphs = () => {
    viewerStore.query.next('');
    showSelectedParagraph = false;
  };

  onDestroy(() => {
    if (image) URL.revokeObjectURL(image);
    subscriptions.forEach((sub) => sub.unsubscribe());
  });
</script>

<div class="viewer">
  <Header {resource} />
  <div class="viewer-body">
    <div class="viewer-left">
      <InputViewer />

      {#if showSelectedParagraph}
        <div class="show-all">
          <small on:click={showAllParagraphs}>{$_('resource.show-all')}</small>
        </div>
      {/if}
      {#if $results && $query.length > 0}
        <Paragraphs paragraphs={$results} />
      {:else}
        <Paragraphs paragraphs={$paragraphs} />
      {/if}

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

<style>
  .viewer {
    background-color: #fff;
    max-width: 100vw;
    width: calc(100vw - 10px);
    height: calc(100vh - 60px);
  }
  .viewer-body {
    display: grid;
    grid-template-columns: 100%;
    background-color: #fff;
  }
  .viewer-left {
    padding: 1em;
    grid-row: start 2;
  }
  .viewer-right {
    padding: 2em 1em;
    background-color: #fbfbfb;
    grid-row: start 1;
  }
  pre {
    font-family: var(--font-family-body);
    white-space: pre-wrap;
  }
  img {
    max-width: 100%;
    height: auto;
  }
  .show-all {
    text-align: right;
  }
  .show-all small {
    cursor: pointer;
    font-weight: var(--font-weight-bold);
    color: var(--color-neutral-strong);
  }

  @media (min-width: 640px) {
    .viewer {
      width: 80vw;
      height: 85vh;
      max-width: 1920px;
    }
    .viewer-body {
      grid-template-columns: 60% 40%;
    }
    .viewer-left {
      padding: 1.75em 3em 0 3em;
      grid-row: start 1;
    }
  }
</style>
