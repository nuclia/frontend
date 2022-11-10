<script lang="ts">
  import { getFile, loadEntities } from '../../core/api';
  import { nucliaState } from '../../core/old-stores/main.store';
  import { _ } from '../../core/i18n';
  import {
    findFileByType,
    search,
    selectParagraph,
    viewerStore,
    viewerState,
    selectSentence,
  } from '../../core/old-stores/viewer.store';
  import { onDestroy, onMount } from 'svelte';
  import { combineLatest, filter, of, switchMap } from 'rxjs';
  import Header from './Header.svelte';
  import Paragraphs from './paragraphs/Paragraphs.svelte';
  import InputViewer from './InputViewer.svelte';
  import Metadata from './Metadata.svelte';
  import Preview from './Preview.svelte';
  import { setAnnotations } from '../../core/stores/annotation.store';
  import { resource } from '../../core/stores/resource.store';
  import { entityGroups } from '../../core/stores/entities.store';

  let imagePath: string | undefined;
  let image: string | undefined;
  let header: HTMLElement;
  let headerHeight;

  const query = viewerState.query;
  const paragraphs = viewerState.paragraphs;
  const results = viewerState.results;
  const hasSearchError = viewerState.hasSearchError;
  const showPreview = viewerState.showPreview;
  const notProcessed = viewerState.isNotProcessed;

  $: {
    imagePath = findFileByType(resource.value, 'image/');
    if (imagePath) {
      getFile(imagePath).subscribe((url) => (image = url));
    }
  }

  $: headerHeight = header?.clientHeight + 'px' || '0';

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
        if (displayedResource.sentence) {
          selectSentence(resource.value!, displayedResource.sentence);
        } else if (displayedResource.paragraph) {
          selectParagraph(resource.value!, displayedResource.paragraph);
        }
      }),

    query
      .pipe(switchMap((query) => (query.length > 0 ? search(resource.value!, query) : of(null))))
      .subscribe((paragraphs) => {
        viewerStore.onlySelected.next(false);
        viewerStore.results.next(paragraphs);
      }),

    combineLatest([paragraphs, viewerStore.currentField])
      .pipe(filter(([paragraphs, currentField]) => paragraphs?.length > 0 && !!currentField))
      .subscribe(([paragraphs, currentField]) => {
        setAnnotations(resource.value!, paragraphs, currentField);
      }),
  ];

  onMount(() => {
    loadEntities().subscribe((entities) => entityGroups.set(entities));
  });

  onDestroy(() => {
    if (image) URL.revokeObjectURL(image);
    subscriptions.forEach((sub) => sub.unsubscribe());
  });
</script>

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
      <InputViewer />
      {#if $notProcessed}
        {$_('error.processing')}
      {/if}

      <div class="paragraphs">
        {#if $hasSearchError}
          <div>
            <strong>{$_('error.search')}</strong>
            <span>{$_('error.search-beta')}</span>
          </div>
        {:else}
          <Paragraphs paragraphs={$results || $paragraphs} />
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
