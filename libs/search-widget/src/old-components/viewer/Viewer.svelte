<script lang="ts">
  import { getFile } from '../../core/api';
  import { _ } from '../../core/i18n';
  import {
    findFileByType,
    search,
    selectParagraph,
    viewerStore,
    viewerState,
    selectSentence,
  } from '../../core/old-stores/viewer.store';
  import { onDestroy } from 'svelte';
  import { combineLatest, filter, map, switchMap } from 'rxjs';
  import Header from './Header.svelte';
  import Paragraphs from './paragraphs/Paragraphs.svelte';
  import InputViewer from './InputViewer.svelte';
  import Metadata from './Metadata.svelte';
  import Preview from './Preview.svelte';
  import { setAnnotations } from '../../core/stores/annotation.store';
  import { selectedFamilyData } from '../../core/stores/entities.store';
  import { resource } from '../../core/stores/resource.store';
  import type { EntityGroup } from '../../core/models';
  import { displayedResource, searchQuery } from '../../core/stores/search.store';
  import { hasViewerSearchError, viewerSearchQuery, viewerSearchResults } from '../../core/stores/viewer-search.store';

  let imagePath: string | undefined;
  let image: string | undefined;
  let header: HTMLElement;
  let headerHeight;

  const paragraphs = viewerState.paragraphs;
  const showPreview = viewerState.showPreview;
  const notProcessed = viewerState.isNotProcessed;
  const nerStyle = selectedFamilyData.pipe(
    map((data: EntityGroup | undefined) => (data ? getHighlightedStyle(data.id, data.color) : '')),
  );

  function getHighlightedStyle(family: string, color: string | undefined): string {
    const css = `mark.ner[family=${family}] {
        background-color: ${color} !important;
      }`;
    // style tag must be split to avoid compilation error
    return '<style' + '>' + css + '</style>';
  }
  $: {
    imagePath = findFileByType(resource.value, 'image/');
    if (imagePath) {
      getFile(imagePath).subscribe((url) => (image = url));
    }
  }

  $: headerHeight = header?.clientHeight + 'px' || '0';

  const triggerSearch = () => {
    const query = viewerSearchQuery.getValue();
    if (query) {
      search(resource.value!, query).subscribe((paragraphs) => {
        viewerStore.onlySelected.next(false);
        viewerSearchResults.set(paragraphs);
      });
    }
  };

  const subscriptions = [
    displayedResource.subscribe(() => viewerStore.init()),
    viewerState.searchReady
      .pipe(
        switchMap(() => combineLatest([searchQuery, displayedResource])),
        filter(
          ([query, displayedResource]) => !!query && (!!displayedResource?.paragraph || !!displayedResource?.sentence),
        ),
      )
      .subscribe(([, displayedResource]) => {
        if (displayedResource.sentence) {
          selectSentence(resource.value!, displayedResource.sentence);
        } else if (displayedResource.paragraph) {
          selectParagraph(resource.value!, displayedResource.paragraph);
        }
      }),

    combineLatest([paragraphs, viewerStore.currentField])
      .pipe(filter(([paragraphs, currentField]) => paragraphs?.length > 0 && !!currentField))
      .subscribe(([paragraphs, currentField]) => {
        setAnnotations(resource.value!, paragraphs, currentField);
      }),
  ];

  onDestroy(() => {
    if (image) URL.revokeObjectURL(image);
    subscriptions.forEach((sub) => sub.unsubscribe());
  });
</script>

<svelte:head>
  {@html $nerStyle}
</svelte:head>
<div
  class="sw-viewer"
  style="--header-height: {headerHeight}">
  <div
    class="viewer-header"
    bind:this={header}>
    <Header />
  </div>
  <div
    class="viewer-body"
    class:preview={$showPreview}>
    <div class="viewer-left">
      <InputViewer on:triggerSearch={triggerSearch} />
      {#if $notProcessed}
        {$_('error.processing')}
      {/if}

      <div class="paragraphs">
        {#if $hasViewerSearchError}
          <div>
            <strong>{$_('error.search')}</strong>
            <span>{$_('error.search-beta')}</span>
          </div>
        {:else}
          <Paragraphs paragraphs={$viewerSearchResults || $paragraphs} />
        {/if}
      </div>

      {#if image}
        <h2>Images</h2>
        <div>
          <img
            src={image}
            alt={$resource?.title + ' preview'} />
        </div>
      {/if}
    </div>

    <div class="viewer-right">
      {#if $showPreview}
        <Preview />
      {:else}
        <Metadata />
      {/if}
    </div>
  </div>
</div>

<style
  lang="scss"
  src="./Viewer.scss"></style>
