<script lang="ts">
  import { IResource, Resource } from '@nuclia/core';
  import { createEventDispatcher, onMount } from 'svelte';
  import { Duration } from '../../common/transition.utils';
  import { fade, slide } from 'svelte/transition';
  import Thumbnail from '../../common/thumbnail/Thumbnail.svelte';
  import IconButton from '../../common/button/IconButton.svelte';
  import { nucliaState } from '../../core/old-stores/main.store';
  import type { PdfWidgetParagraph } from '../../core/models';
  import ParagraphResult from '../../common/paragraph-result/ParagraphResult.svelte';
  import AllResultsToggle from '../../common/paragraph-result/AllResultsToggle.svelte';
  import DocTypeIndicator from '../../common/indicators/DocTypeIndicator.svelte';
  import { _ } from '../../core/i18n';
  import PdfViewer from './PdfViewer.svelte';
  import { loadPdfJs } from '../../core/utils';
  import { debounceTime, map, Observable, Subject } from 'rxjs';
  import { getRegionalBackend, getResource } from '../../core/api';
  import { getFileField } from '../../core/old-stores/viewer.store';
  import { tap } from 'rxjs/operators';
  import SearchResultNavigator from "./SearchResultNavigator.svelte";

  export let result: IResource = {id: ''} as IResource;

  const dispatch = createEventDispatcher();
  let innerWidth = window.innerWidth;
  const closeButtonWidth = 48;

  let expanded = false;
  let thumbnailLoaded = false;
  let showAllResults = false;
  let selectedParagraph: PdfWidgetParagraph | undefined;
  let resultIndex: number | undefined;
  let resource: Observable<Resource>;
  let pdfUrl: Observable<string>;
  let headerActionsWidth = 0;
  const resizeEvent = new Subject();
  let resultNavigatorWidth;

  $: isMobile = innerWidth < 448;
  $: defaultTransitionDuration = expanded ? Duration.MODERATE : 0;
  $: isExpandedFullScreen = innerWidth < 820;


  let paragraphList: PdfWidgetParagraph[];
  const matchingParagraphs$ = nucliaState().getMatchingParagraphs(result.id).pipe(tap(paragraphs => paragraphList = paragraphs as PdfWidgetParagraph[]));

  onMount(() => {
    loadPdfJs();
    resizeEvent.pipe(debounceTime(100)).subscribe(() => setHeaderActionWidth());
  });

  const openParagraph = (paragraph, index) => {
    resultIndex = index;
    selectedParagraph = paragraph;
    expanded = true;
    open();
  };
  const openPrevious = () => {
    if (resultIndex > 0) {
      resultIndex -= 1;
      selectedParagraph = paragraphList[resultIndex];
    }
  };
  const openNext = () => {
    if (resultIndex < paragraphList.length - 1) {
      resultIndex += 1;
      selectedParagraph = paragraphList[resultIndex];
    }
  };

  const open = () => {
    setTimeout(() => setHeaderActionWidth());
    if (!pdfUrl) {
      pdfUrl = getResource(result.id).pipe(
        map(res => {
          const fileField = getFileField(res, res.id);
          const file = fileField?.value?.file;
          return file ? `${getRegionalBackend()}${file.uri}` : '';
        }),
      );
    }
  };

  const closePreview = () => {
    expanded = false;
    if (isExpandedFullScreen) {
      dispatch('closePreview');
    }
  };

  const setHeaderActionWidth = () => {
    if (expanded) {
      headerActionsWidth = isMobile ? closeButtonWidth : resultNavigatorWidth + closeButtonWidth;
    }
  }
</script>

<svelte:window bind:innerWidth
               on:resize={(event) => resizeEvent.next(event)}/>
<div class="sw-tile sw-pdf-tile"
     class:expanded>

  <div class="thumbnail-container">
    <div hidden={expanded}>
      <Thumbnail src={result.thumbnail}
                 aspectRatio="5/4"
                 on:loaded={() => thumbnailLoaded = true}/>
    </div>

    {#if expanded}
      {#if isMobile}
        <SearchResultNavigator {resultIndex}
                               total={$matchingParagraphs$.length}
                               on:openPrevious={openPrevious}
                               on:openNext={openNext} />
      {/if}
      <div class="pdf-viewer-container">
        <PdfViewer src={$pdfUrl}
                   paragraph={selectedParagraph}
                   showController={!isMobile}/>
      </div>
    {/if}
  </div>

  {#if thumbnailLoaded}
    <div class="result-details"
         transition:fade={{duration: Duration.SUPERFAST}}>
      <header style:--header-actions-width={`${headerActionsWidth}px`}>
        <div class:header-title={expanded}>
          <div class="doc-type-container">
            <DocTypeIndicator type="pdf"/>
          </div>
          <h3 class="ellipsis">{result?.title}</h3>
        </div>

        {#if expanded}
          <div class="header-actions"
               in:fade={{duration: Duration.FAST}}>

            {#if !isMobile}
              <SearchResultNavigator {resultIndex}
                                     total={$matchingParagraphs$.length}
                                     on:offsetWidth={(event) => resultNavigatorWidth = event.detail.offsetWidth}
                                     on:openPrevious={openPrevious}
                                     on:openNext={openNext} />
            {/if}
            <IconButton icon="cross"
                        ariaLabel="{$_('generic.close')}"
                        aspect="basic"
                        on:click={closePreview}/>
          </div>
        {/if}
      </header>

      {#if !expanded}
        <div class="search-result-paragraphs"
             tabindex="-1">
          <ul transition:slide={{duration: defaultTransitionDuration}}
              class="paragraphs-container"
              class:expanded={showAllResults}
              class:can-expand={$matchingParagraphs$.length > 4}
              style="--paragraph-count: {$matchingParagraphs$.length}">
            {#each $matchingParagraphs$ as paragraph, index}
              <ParagraphResult {paragraph}
                               hideIndicator
                               ellipsis={!expanded}
                               minimized={isMobile && !expanded}
                               stack={expanded}
                               selected={paragraph === selectedParagraph}
                               on:open={(event) => openParagraph(event.detail.paragraph, index)}/>
            {/each}
          </ul>
        </div>

        {#if $matchingParagraphs$.length > 4}
          <AllResultsToggle {showAllResults}
                            on:toggle={() => (showAllResults = !showAllResults)}/>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style lang="scss" src="./PdfTile.scss"></style>
