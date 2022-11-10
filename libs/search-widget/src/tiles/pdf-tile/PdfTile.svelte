<script lang="ts">
  import { IResource, Resource, Search } from '@nuclia/core';
  import { onDestroy, onMount } from 'svelte';
  import { Duration } from '../../common/transition.utils';
  import { fade, slide } from 'svelte/transition';
  import Thumbnail from '../../common/thumbnail/Thumbnail.svelte';
  import IconButton from '../../common/button/IconButton.svelte';
  import { nucliaState, nucliaStore } from '../../core/old-stores/main.store';
  import type { PdfWidgetParagraph } from '../../core/models';
  import ParagraphResult from '../../common/paragraph-result/ParagraphResult.svelte';
  import AllResultsToggle from '../../common/paragraph-result/AllResultsToggle.svelte';
  import DocTypeIndicator from '../../common/indicators/DocTypeIndicator.svelte';
  import { _ } from '../../core/i18n';
  import PdfViewer from './PdfViewer.svelte';
  import { BehaviorSubject, combineLatest, debounceTime, map, Observable, Subject } from 'rxjs';
  import { getRegionalBackend, getResource } from '../../core/api';
  import { getFileField, viewerStore } from '../../core/old-stores/viewer.store';
  import { tap } from 'rxjs/operators';
  import SearchResultNavigator from './SearchResultNavigator.svelte';
  import Icon from '../../common/icons/Icon.svelte';
  import { getPdfJsBaseUrl, getPdfJsStyle } from '../../core/utils';
  import { freezeBackground, unblockBackground } from '../../common/modal/modal.utils';

  export let result: IResource = { id: '' } as IResource;

  const pdfStyle = getPdfJsStyle();
  const pdfJsBaseUrl = getPdfJsBaseUrl();
  const pdfOverrideStyle = `.nuclia-widget .textLayer .highlight.selected {
    background-color: var(--color-primary-regular);
    border-radius: 0;
    margin: -4px;
    padding: 2px 4px;
  }`;

  let innerWidth = window.innerWidth;
  const closeButtonWidth = 48;

  let expanded = false;
  let thumbnailLoaded = false;
  let showAllResults = false;
  let selectedParagraph: PdfWidgetParagraph | undefined;
  let resultIndex: number | undefined;
  let pdfUrl: Observable<string>;
  let headerActionsWidth = 0;
  let resultNavigatorWidth;
  let resultNavigatorDisabled = false;
  let sidePanelExpanded = false;
  const resizeEvent = new Subject();
  let findInputElement: HTMLElement;

  const globalQuery = nucliaStore().query;
  const findInPdfQuery = viewerStore.query;
  findInPdfQuery['set'] = findInPdfQuery.next;

  $: isMobile = innerWidth < 448;
  $: defaultTransitionDuration = expanded ? Duration.MODERATE : 0;

  let resource: Resource | undefined;
  let paragraphList: PdfWidgetParagraph[];
  const isSearchingInPdf = new BehaviorSubject(false);
  const matchingParagraphs$ = combineLatest([
    nucliaState()
      .getMatchingParagraphs(result.id)
      .pipe(tap((paragraphs) => (paragraphList = paragraphs as PdfWidgetParagraph[]))),
    viewerStore.results,
    isSearchingInPdf,
  ]).pipe(
    map(([globalResult, inPdfResults, isInPdf]) => (isInPdf ? inPdfResults : globalResult)),
    map((results) => results || []),
  );

  onMount(() => {
    viewerStore.init();
    resizeEvent.pipe(debounceTime(100)).subscribe(() => setHeaderActionWidth());
  });

  onDestroy(() => reset());

  const openParagraph = (paragraph, index) => {
    resultIndex = index;
    selectedParagraph = paragraph;
    if (!expanded) {
      findInPdfQuery.next(globalQuery.value);
      expanded = true;
      freezeBackground(true);
    }
    setTimeout(() => setHeaderActionWidth());

    if (!pdfUrl) {
      pdfUrl = getResource(result.id).pipe(
        map((res) => {
          resource = res;
          const fileField = getFileField(res, res.id);
          const file = fileField?.value?.file;
          return file ? `${getRegionalBackend()}${file.uri}` : '';
        }),
      );
    }
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

  const closePreview = () => {
    reset();
    unblockBackground(true);
  };

  const setHeaderActionWidth = () => {
    if (expanded) {
      headerActionsWidth = isMobile ? closeButtonWidth : resultNavigatorWidth + closeButtonWidth;
    }
  };

  const toggleSidePanel = () => {
    sidePanelExpanded = !sidePanelExpanded;
    resultNavigatorDisabled = sidePanelExpanded;
    if (sidePanelExpanded) {
      // Wait for animation to finish before focusing on find input, otherwise the focus is breaking the transition
      setTimeout(() => findInputElement.focus(), Duration.MODERATE);
    } else if (isSearchingInPdf.value) {
      selectedParagraph = undefined;
      resultIndex = -1;
      isSearchingInPdf.next(false);
      findInPdfQuery.next(globalQuery.value);
    }
  };

  const findInPdf = () => {
    const query = findInPdfQuery.value.trim();
    if (resource && query) {
      isSearchingInPdf.next(true);
      resource
        .search(query, [Search.ResourceFeatures.PARAGRAPH], { highlight: true })
        .pipe(
          tap((results) => {
            if (results.error) {
              viewerStore.hasSearchError.next(true);
            }
          }),
          map((results) => results.paragraphs?.results || []),
        )
        .subscribe((paragraphs) => {
          resultIndex = -1;
          viewerStore.results.next(paragraphs);
        });
    } else {
      isSearchingInPdf.next(false);
    }
  };

  const handleKeydown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
      event.preventDefault();
      event.stopPropagation();
      toggleSidePanel();
    }
  };

  function reset() {
    expanded = false;
    selectedParagraph = undefined;
    setTimeout(() => {
      isSearchingInPdf.next(false);
      viewerStore.init();
      sidePanelExpanded = false;
      resultNavigatorDisabled = false;
    });
  }
</script>

<svelte:window
  bind:innerWidth
  on:keydown={handleKeydown}
  on:resize={(event) => resizeEvent.next(event)} />
<svelte:head>
  <script src="{pdfJsBaseUrl}/build/pdf.min.js"></script>
  <script src="{pdfJsBaseUrl}/web/pdf_viewer.js"></script>
</svelte:head>
{#if $pdfStyle}
  <svelte:element this="style">{@html $pdfStyle}</svelte:element>
{/if}
<svelte:element this="style">{@html pdfOverrideStyle}</svelte:element>
<div
  class="sw-tile sw-pdf-tile"
  class:expanded
  class:side-panel-expanded={sidePanelExpanded}>
  <div class="thumbnail-container">
    <div hidden={expanded}>
      <Thumbnail
        src={result.thumbnail}
        aspectRatio="5/4"
        on:loaded={() => (thumbnailLoaded = true)} />
    </div>

    {#if expanded}
      {#if isMobile}
        <SearchResultNavigator
          {resultIndex}
          total={$matchingParagraphs$.length}
          on:openPrevious={openPrevious}
          on:openNext={openNext} />
      {/if}
      <div class="pdf-viewer-container">
        <PdfViewer
          src={$pdfUrl}
          paragraph={selectedParagraph}
          showController={!isMobile} />
      </div>
    {/if}
  </div>

  {#if thumbnailLoaded}
    <div
      class="result-details"
      transition:fade={{ duration: Duration.SUPERFAST }}>
      <header style:--header-actions-width={`${headerActionsWidth}px`}>
        <div class:header-title={expanded}>
          <div class="doc-type-container">
            <DocTypeIndicator type="pdf" />
          </div>
          <h3 class="ellipsis">{result?.title}</h3>
        </div>

        {#if expanded}
          <div
            class="header-actions"
            in:fade={{ duration: Duration.FAST }}>
            {#if !isMobile}
              <SearchResultNavigator
                resultIndex={$matchingParagraphs$.length > 0 ? resultIndex : -1}
                total={$matchingParagraphs$.length}
                disabled={resultNavigatorDisabled}
                on:offsetWidth={(event) => (resultNavigatorWidth = event.detail.offsetWidth)}
                on:openPrevious={openPrevious}
                on:openNext={openNext} />
            {/if}
            <IconButton
              icon="cross"
              ariaLabel={$_('generic.close')}
              aspect="basic"
              on:click={closePreview} />
          </div>
        {/if}
      </header>

      <div class:side-panel={expanded}>
        {#if expanded}
          <div
            class="side-panel-button"
            on:click={toggleSidePanel}>
            <Icon name={sidePanelExpanded ? 'chevrons-left' : 'search'} />
          </div>
        {/if}

        <div class:side-panel-content={expanded}>
          <div
            class="find-bar-container"
            tabindex="0"
            hidden={!expanded}>
            <Icon name="search" />
            <input
              class="find-input"
              type="text"
              autocomplete="off"
              aria-label="Find in document"
              placeholder="Find in document"
              tabindex="-1"
              bind:this={findInputElement}
              bind:value={$findInPdfQuery}
              on:change={findInPdf} />
          </div>

          <div
            class="search-result-paragraphs"
            tabindex="-1">
            <ul
              transition:slide={{ duration: defaultTransitionDuration }}
              class="paragraphs-container"
              class:expanded={showAllResults}
              class:can-expand={$matchingParagraphs$.length > 4}
              style="--paragraph-count: {$matchingParagraphs$.length}">
              {#each $matchingParagraphs$ as paragraph, index}
                <ParagraphResult
                  {paragraph}
                  hideIndicator
                  ellipsis={!expanded}
                  minimized={isMobile && !expanded}
                  stack={expanded}
                  selected={paragraph === selectedParagraph}
                  on:open={(event) => openParagraph(event.detail.paragraph, index)} />
              {/each}
            </ul>
          </div>
        </div>
      </div>

      {#if !expanded && $matchingParagraphs$.length > 4}
        <AllResultsToggle
          {showAllResults}
          on:toggle={() => (showAllResults = !showAllResults)} />
      {/if}
    </div>
  {/if}
</div>

<style
  lang="scss"
  src="./PdfTile.scss"></style>
