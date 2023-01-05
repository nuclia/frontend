<script lang="ts">
  import { Resource, Search } from '@nuclia/core';
  import { PreviewKind, WidgetParagraph } from '../../core/models';
  import { BehaviorSubject, combineLatest, debounceTime, map, Observable, Subject, take } from 'rxjs';
  import { Duration } from '../../common/transition.utils';
  import { mapSmartParagraph2WidgetParagraph, getExternalUrl, goToUrl } from '../../core/utils';
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { freezeBackground, unblockBackground } from '../../common/modal/modal.utils';
  import { tap } from 'rxjs/operators';
  import AllResultsToggle from '../../common/paragraph-result/AllResultsToggle.svelte';
  import ParagraphResult from '../../common/paragraph-result/ParagraphResult.svelte';
  import Icon from '../../common/icons/Icon.svelte';
  import { _ } from '../../core/i18n';
  import { IconButton } from '../../common';
  import SearchResultNavigator from '../pdf-tile/SearchResultNavigator.svelte';
  import DocTypeIndicator from '../../common/indicators/DocTypeIndicator.svelte';
  import Thumbnail from '../../common/thumbnail/Thumbnail.svelte';
  import { fade, slide } from 'svelte/transition';
  import { searchQuery } from '../../core/stores/search.store';
  import { hasViewerSearchError, viewerSearchQuery, viewerSearchResults } from '../../core/stores/viewer-search.store';
  import { navigateToLink } from '../../core/stores/widget.store';

  export let result: Search.SmartResult = { id: '' } as Search.SmartResult;
  export let resourceObs: Observable<Resource>;
  export let fallbackThumbnail;
  export let previewKind: PreviewKind;

  const dispatch = createEventDispatcher();

  let innerWidth = window.innerWidth;
  const closeButtonWidth = 48;

  let expanded = false;
  let thumbnailLoaded = false;
  let showAllResults = false;
  let selectedParagraph: WidgetParagraph | undefined;
  let resultIndex: number | undefined;
  let headerActionsWidth = 0;
  let resultNavigatorWidth;
  let resultNavigatorDisabled = false;
  let sidePanelExpanded = false;
  const resizeEvent = new Subject();
  let findInputElement: HTMLElement;

  const globalQuery = searchQuery;

  $: isMobile = innerWidth < 448;
  $: defaultTransitionDuration = expanded ? Duration.MODERATE : 0;

  let resource: Resource | undefined;
  let paragraphList: WidgetParagraph[];
  const isSearchingInResource = new BehaviorSubject(false);
  const matchingParagraphs$: Observable<WidgetParagraph[]> = combineLatest([
    viewerSearchResults,
    isSearchingInResource,
  ]).pipe(
    map(([inResourceResults, isInResource]: [WidgetParagraph[], boolean]) => {
      // paragraphList is used for next/previous buttons
      paragraphList = isInResource
        ? inResourceResults
        : result.paragraphs?.map((paragraph) => mapSmartParagraph2WidgetParagraph(paragraph, previewKind)) || [];
      return paragraphList;
    }),
    map((results) => results || []),
  );

  onMount(() => {
    resizeEvent.pipe(debounceTime(100)).subscribe(() => setHeaderActionWidth());
  });

  onDestroy(() => reset());
  const onClickParagraph = (paragraph, index) => {
    navigateToLink.pipe(take(1)).subscribe((navigateToLink) => {
      const url = getExternalUrl(result);
      if (navigateToLink && url) {
        goToUrl(url, paragraph.text);
      } else {
        openParagraph(paragraph, index);
      }
    });
  };

  const openParagraph = (paragraph, index) => {
    selectParagraph(paragraph);
    if (!expanded) {
      openDocument(index);
    }
    setTimeout(() => setHeaderActionWidth());
  };

  const openDocument = (index = -1) => {
    resultIndex = index;
    viewerSearchQuery.set(globalQuery.getValue());
    expanded = true;
    freezeBackground(true);
    if (!resource) {
      resourceObs.subscribe((res) => (resource = res));
    }
  };

  const selectParagraph = (paragraph) => {
    selectedParagraph = paragraph;
    dispatch('selectParagraph', { paragraph });
  };

  const openPrevious = () => {
    if (resultIndex > 0) {
      resultIndex -= 1;
      selectParagraph(paragraphList[resultIndex]);
    }
  };
  const openNext = () => {
    if (resultIndex < paragraphList.length - 1) {
      resultIndex += 1;
      selectParagraph(paragraphList[resultIndex]);
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
    } else if (isSearchingInResource.value) {
      selectParagraph(undefined);
      resultIndex = -1;
      isSearchingInResource.next(false);
      viewerSearchQuery.set(globalQuery.getValue());
    }
  };

  const findInPdf = () => {
    const query = viewerSearchQuery.getValue();
    if (resource && query) {
      isSearchingInResource.next(true);
      resource
        .search(query, [Search.ResourceFeatures.PARAGRAPH], { highlight: true })
        .pipe(
          tap((results) => {
            if (results.error) {
              hasViewerSearchError.set(true);
            }
          }),
          map((results) => results.paragraphs?.results || []),
        )
        .subscribe((paragraphs) => {
          resultIndex = -1;
          viewerSearchResults.set(
            paragraphs.map((paragraph) => mapSmartParagraph2WidgetParagraph(paragraph, PreviewKind.PDF)),
          );
        });
    } else {
      isSearchingInResource.next(false);
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
    selectParagraph(undefined);
    setTimeout(() => {
      isSearchingInResource.next(false);
      sidePanelExpanded = false;
      resultNavigatorDisabled = false;
    });
  }
</script>

<svelte:window
  bind:innerWidth
  on:keydown={handleKeydown}
  on:resize={(event) => resizeEvent.next(event)} />

<div
  class="sw-tile"
  class:expanded
  class:side-panel-expanded={sidePanelExpanded}>
  <div class="thumbnail-container">
    <div hidden={expanded}>
      <Thumbnail
        src={result.thumbnail}
        fallback={fallbackThumbnail}
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
      <div class="resource-viewer-container">
        <slot />
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
            <DocTypeIndicator type={previewKind === PreviewKind.PDF ? 'pdf' : 'text'} />
          </div>
          <h3
            class="ellipsis"
            on:click={() => openDocument()}>
            {result?.title}
          </h3>
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
              bind:value={$viewerSearchQuery}
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
                  hideIndicator={!paragraph.page}
                  ellipsis={!expanded}
                  minimized={isMobile && !expanded}
                  stack={expanded}
                  selected={paragraph === selectedParagraph}
                  on:open={(event) => onClickParagraph(event.detail.paragraph, index)} />
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
  src="./DocumentTile.scss"></style>
