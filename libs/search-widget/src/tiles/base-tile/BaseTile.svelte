<script lang="ts">
  import AllResultsToggle from '../../common/paragraph-result/AllResultsToggle.svelte';
  import ParagraphResult from '../../common/paragraph-result/ParagraphResult.svelte';
  import TileHeader from './header/TileHeader.svelte';
  import Icon from '../../common/icons/Icon.svelte';
  import type { FieldFullId, Search } from '@nuclia/core';
  import type { MediaWidgetParagraph, WidgetParagraph } from '../../core/models';
  import { PreviewKind } from '../../core/models';
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import {
    BehaviorSubject,
    combineLatest,
    debounceTime,
    distinctUntilChanged,
    filter,
    iif,
    map,
    mergeMap,
    Observable,
    of,
    Subject,
    take,
    takeUntil
  } from 'rxjs';
  import { searchQuery, trackingEngagement } from '../../core/stores/search.store';
  import { Duration, isMobileViewport } from '../../common/utils';
  import { viewerSearchQuery, viewerSearchResults } from '../../core/stores/viewer-search.store';
  import {
    getNavigationUrl,
    goToUrl,
    mapParagraph2WidgetParagraph,
    mapSmartParagraph2WidgetParagraph
  } from '../../core/utils';
  import { isKnowledgeGraphEnabled, navigateToFile, navigateToLink } from '../../core/stores/widget.store';
  import {
    fieldFullId,
    fieldList,
    fieldSummary,
    getMediaTranscripts,
    hasSeveralFields,
    isPreviewing,
    resourceTitle,
    viewerState
  } from '../../core/stores/viewer.store';
  import { freezeBackground, unblockBackground } from '../../common/modal/modal.utils';
  import { getResourceField, searchInResource } from '../../core/api';
  import SearchResultNavigator from './header/SearchResultNavigator.svelte';
  import { _ } from '../../core/i18n';
  import KnowledgeGraphPanel from '../../components/knowledge-graph/KnowledgeGraphPanel.svelte';
  import { graphQuery } from '../../core/stores/graph.store';
  import D3Loader from '../../components/knowledge-graph/D3Loader.svelte';

  export let result: Search.FieldResult;
  export let previewKind: PreviewKind;
  export let typeIndicator: string;
  export let thumbnailLoaded = false;
  export let loading = false;
  export let noResultNavigator = false;
  export let viewerFullHeight = false;

  const dispatch = createEventDispatcher();
  const unsubscribeAll = new Subject();
  const resizeEvent = new Subject();
  const findInPlaceholderPrefix = 'tile.find-in-';

  let innerWidth = window.innerWidth;
  let viewerHeight = 0;

  let expanded = false;
  let showAllResults = false;
  let selectedParagraph: WidgetParagraph | undefined;
  let resultIndex: number | undefined;
  let headerActionsWidth = 0;
  let resultNavigatorWidth = 0;
  let summaryHeight = 0;
  let resultNavigatorDisabled = false;
  let sidePanelExpanded = false;
  let findInputElement: HTMLElement;
  let findInPlaceholder = '';
  let isMediaPlayer = false;
  let transcriptsInitialized = false;
  let sidePanelSectionOpen: 'search' | 'transcripts' | 'summary' | 'items' = 'search';
  let transcripts: Observable<MediaWidgetParagraph[]> = of([]);
  let showKnowledgeGraph = false;
  const paragraphHeights: number[] = [];

  const metadataBlockCount = combineLatest([
    fieldSummary.pipe(distinctUntilChanged()),
    hasSeveralFields.pipe(distinctUntilChanged())
  ]).pipe(
    map(blocks => blocks.reduce((count, hasBlock) => {
      if (hasBlock) {
        count += 1;
      }
      return count;
    }, 0))
  );

  $: fullListHeight = paragraphHeights.reduce((sum, height) => (sum += height), 0);
  $: isMobile = isMobileViewport(innerWidth);
  $: defaultTransitionDuration = expanded ? Duration.MODERATE : 0;
  $: switch (previewKind) {
    case PreviewKind.AUDIO:
      findInPlaceholder = `${findInPlaceholderPrefix}audio`;
      isMediaPlayer = true;
      break;
    case PreviewKind.VIDEO:
    case PreviewKind.YOUTUBE:
      findInPlaceholder = `${findInPlaceholderPrefix}video`;
      isMediaPlayer = true;
      break;
    case PreviewKind.IMAGE:
      findInPlaceholder = `${findInPlaceholderPrefix}image`;
      break;
    default:
      findInPlaceholder = `${findInPlaceholderPrefix}document`;
      break;
  }

  function initTranscript(kind: PreviewKind.VIDEO | PreviewKind.AUDIO | PreviewKind.YOUTUBE) {
    transcriptsInitialized = true;
    setTimeout(() => {
      transcripts = getMediaTranscripts(kind);
    });
  }

  let paragraphList: WidgetParagraph[] = [];
  const isSearchingInResource = new BehaviorSubject(false);
  const matchingParagraphs$: Observable<WidgetParagraph[]> = combineLatest([
    viewerSearchResults,
    isSearchingInResource
  ]).pipe(
    map(([inResourceResults, isInResource]) => {
      // paragraphList is used for next/previous buttons
      paragraphList = isInResource
        ? ((inResourceResults || []) as WidgetParagraph[])
        : result.paragraphs?.map((paragraph) => mapSmartParagraph2WidgetParagraph(paragraph, previewKind)) ||
        ([] as WidgetParagraph[]);
      return paragraphList;
    })
  );

  onMount(() => {
    resizeEvent.pipe(debounceTime(100)).subscribe(() => setHeaderActionWidth());
    const currentId = fieldFullId.getValue();
    if (
      currentId?.resourceId === result.id &&
      currentId?.field_type === result.field?.field_type &&
      currentId.field_id === result.field?.field_id
    ) {
      openParagraph(undefined, -1);
    }

    isPreviewing
      .pipe(
        filter((previewOpen) => !previewOpen && expanded),
        takeUntil(unsubscribeAll)
      )
      .subscribe(() => closePreview());
  });

  onDestroy(() => {
    unsubscribeAll.next(true);
    unsubscribeAll.complete();
    reset();
  });

  const onClickParagraph = (paragraph: WidgetParagraph | undefined, index: number) => {
    trackingEngagement.set({ type: 'RESULT', rid: result.id, paragraph: paragraph?.paragraph });
    if (expanded) {
      openParagraph(paragraph, index);
      return;
    }
    if (!result.field) return;
    const fullId = {
      field_id: result.field.field_id,
      field_type: result.field.field_type,
      resourceId: result.id
    };
    combineLatest([navigateToFile, navigateToLink])
      .pipe(
        take(1),
        mergeMap(([navigateToFile, navigateToLink]) =>
          iif(
            () => navigateToFile || navigateToLink,
            getResourceField(fullId, true).pipe(
              mergeMap((field) => getNavigationUrl(navigateToFile, navigateToLink, result, field))
            ),
            of(false)
          )
        )
      )
      .subscribe((url) => {
        if (url) {
          goToUrl(url as string, paragraph?.text);
        } else {
          fieldFullId.set(fullId);
          resourceTitle.set(result.title || '');
          openParagraph(paragraph, index);
        }
      });
  };

  const openParagraph = (paragraph: WidgetParagraph | undefined, index: number) => {
    resultIndex = index;
    selectParagraph(paragraph);
    if (!expanded) {
      expanded = true;
      isPreviewing.set(true);
      viewerSearchQuery.set(searchQuery.getValue());
      freezeBackground(true);
    }
    setTimeout(() => setHeaderActionWidth());
  };

  const selectParagraph = (paragraph: WidgetParagraph | undefined) => {
    selectedParagraph = paragraph;
    dispatch('selectParagraph', paragraph);
  };

  const openPrevious = () => {
    if (resultIndex && resultIndex > 0) {
      resultIndex -= 1;
      selectParagraph(paragraphList[resultIndex]);
    }
  };
  const openNext = () => {
    if (resultIndex !== undefined && resultIndex < paragraphList.length - 1) {
      resultIndex += 1;
      selectParagraph(paragraphList[resultIndex]);
    }
  };

  const closePreview = () => {
    reset();
    unblockBackground(true);
    dispatch('close');
  };

  const closeSidePanel = () => {
    sidePanelExpanded = false;
  };

  const setHeaderActionWidth = () => {
    if (expanded) {
      headerActionsWidth = isMobile ? 0 : resultNavigatorWidth;
    }
  };

  const toggleSidePanel = () => {
    sidePanelExpanded = !sidePanelExpanded;
    resultNavigatorDisabled = sidePanelExpanded;
    if (!showKnowledgeGraph) {
      if (sidePanelExpanded) {
        // Wait for animation to finish before focusing on find input, otherwise the focus is breaking the transition
        setTimeout(() => findInputElement.focus(), Duration.MODERATE);
      } else if (isSearchingInResource.value) {
        selectParagraph(undefined);
        resultIndex = -1;
        isSearchingInResource.next(false);
        viewerSearchQuery.set(searchQuery.getValue());
      }
    }
  };

  const findInField = () => {
    const query = viewerSearchQuery.getValue();
    sidePanelSectionOpen = 'search';
    if (query) {
      isSearchingInResource.next(true);
      searchInResource(query, result, { highlight: true })
        .pipe(map((results) => results.paragraphs?.results || []))
        .subscribe((paragraphs) => {
          resultIndex = -1;
          viewerSearchResults.set(paragraphs.map((paragraph) => mapParagraph2WidgetParagraph(paragraph, previewKind)));
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
    } else if (event.key === 'Escape') {
      closePreview();
    }
  };

  function reset() {
    expanded = false;
    showKnowledgeGraph = false;
    isPreviewing.set(false);
    selectedParagraph = undefined;
    setTimeout(() => {
      isSearchingInResource.next(false);
      sidePanelExpanded = false;
      resultNavigatorDisabled = false;
      viewerState.reset();
    });
  }

  function isSame(paragraph, selectedParagraph: WidgetParagraph) {
    return JSON.stringify(paragraph) === JSON.stringify(selectedParagraph);
  }

  function toggleTranscriptSection() {
    sidePanelSectionOpen = sidePanelSectionOpen === 'transcripts' ? 'search' : 'transcripts';

    if (sidePanelSectionOpen === 'transcripts' && isMediaPlayer && !transcriptsInitialized) {
      initTranscript(previewKind as PreviewKind.VIDEO | PreviewKind.AUDIO | PreviewKind.YOUTUBE);
    }
    // TODO manage mobile
  }

  function toggleSummarySection() {
    sidePanelSectionOpen = sidePanelSectionOpen === 'summary' ? 'search' : 'summary';
    // TODO manage mobile
  }

  function toggleItemsSection() {
    sidePanelSectionOpen = sidePanelSectionOpen === 'items' ? 'search' : 'items';
    // TODO manage mobile
  }

  function openSearchSection() {
    sidePanelSectionOpen = 'search';
  }

  function toggleKnowledgeGraph() {
    showKnowledgeGraph = !showKnowledgeGraph;
  }

  function findInGraph() {
    //TODO
    const query = graphQuery.getValue();
    console.log(`Todo: find ${query} in graph`);
  }

  function selectParagraphFromGraph(event) {
    toggleKnowledgeGraph();
    toggleSidePanel();
    openParagraph(event.detail, -1);
  }

  function displayField(item: FieldFullId) {
    fieldFullId.set(item);
  }
</script>

<svelte:window
  bind:innerWidth
  on:keydown={handleKeydown}
  on:resize={(event) => resizeEvent.next(event)} />

<div
  class="sw-tile"
  class:expanded
  class:side-panel-expanded={sidePanelExpanded}
  class:media-player={isMediaPlayer}
  style:--viewer-height={viewerHeight+'px'}
  style:--metadata-block-count={$metadataBlockCount}>
  {#if !showKnowledgeGraph}
    <div class="thumbnail-container">
      <div hidden={expanded && !loading}>
        <slot name="thumbnail" />
      </div>

      {#if expanded}
        {#if isMobile && !noResultNavigator}
          <SearchResultNavigator
            {resultIndex}
            total={$matchingParagraphs$.length}
            on:openPrevious={openPrevious}
            on:openNext={openNext} />
        {/if}
        <div
          bind:offsetHeight={viewerHeight}
          class="field-viewer-container"
          class:full-height={viewerFullHeight}
          style:--summary-height={`${summaryHeight}px`}
          class:loading>
          <slot name="viewer" />
        </div>
      {/if}
    </div>
  {/if}

  {#if thumbnailLoaded}
    <div class="result-details">
      <TileHeader
        {expanded}
        {headerActionsWidth}
        {typeIndicator}
        resourceTitle={result.title}
        on:clickOnTitle={() => onClickParagraph(undefined, -1)}
        on:close={closePreview}
        on:menuOpen={closeSidePanel}>
        {#if !isMobile && !noResultNavigator && !sidePanelExpanded && !showKnowledgeGraph}
          <SearchResultNavigator
            resultIndex={$matchingParagraphs$.length > 0 ? resultIndex : -1}
            total={$matchingParagraphs$.length}
            disabled={resultNavigatorDisabled}
            on:offsetWidth={(event) => (resultNavigatorWidth = event.detail.offsetWidth)}
            on:openPrevious={openPrevious}
            on:openNext={openNext} />
        {/if}
      </TileHeader>

      <div class:side-panel={expanded}>
        {#if expanded && !isMobile}
          <div class="side-panel-button-container">
            {#if !showKnowledgeGraph}
              <div
                class="side-panel-button"
                on:click={toggleSidePanel}>
                <Icon name={sidePanelExpanded ? 'chevrons-right' : 'search'} />
              </div>
            {:else}
              <div
                class="side-panel-button"
                on:click={toggleSidePanel}>
                <Icon name={sidePanelExpanded ? 'chevrons-right' : 'info'} />
              </div>
            {/if}

            {#if $isKnowledgeGraphEnabled}
              <div
                class="side-panel-button"
                on:click={toggleKnowledgeGraph}>
                <Icon name={showKnowledgeGraph ? 'cross' : 'submenu'} />
              </div>
            {/if}
          </div>
        {/if}

        <div class:side-panel-content={expanded}>
          {#if showKnowledgeGraph}
            {#if !isMobile}
              <div
                class="find-bar-container"
                tabindex="0"
                hidden={!expanded}>
                <Icon name="search" />
                <input
                  class="find-input"
                  type="text"
                  autocomplete="off"
                  tabindex="-1"
                  bind:value={$graphQuery}
                  on:change={findInGraph} />
              </div>
            {/if}
            <KnowledgeGraphPanel on:selectParagraph={selectParagraphFromGraph} />
          {:else}
            {#if !isMobile}
              <div
                class="find-bar-container"
                tabindex="0"
                hidden={!expanded}>
                <Icon name="search" />
                <input
                  class="find-input"
                  type="text"
                  autocomplete="off"
                  aria-label={$_(findInPlaceholder)}
                  placeholder={$_(findInPlaceholder)}
                  tabindex="-1"
                  bind:this={findInputElement}
                  bind:value={$viewerSearchQuery}
                  on:change={findInField} />
              </div>
            {/if}

            {#if (isMobile && !expanded) || (!isMobile && sidePanelSectionOpen === 'search')}
              <div
                class="search-result-paragraphs"
                tabindex="-1">
                <ul
                  class="paragraphs-container"
                  class:expanded={showAllResults}
                  class:can-expand={$matchingParagraphs$.length > 4}>
                  {#each $matchingParagraphs$ as paragraph, index}
                    <ParagraphResult
                      {paragraph}
                      ellipsis={!expanded}
                      minimized={isMobile && !expanded}
                      stack={expanded}
                      selected={isSame(paragraph, selectedParagraph)}
                      on:paragraphHeight={(event) => (paragraphHeights[index] = event.detail)}
                      on:open={() => onClickParagraph(paragraph, index)} />
                  {/each}
                </ul>
              </div>
            {:else if !isMobile}
              <div
                class="metadata-expander-header"
                tabindex="0"
                class:expanded={sidePanelSectionOpen === 'search'}
                on:click={openSearchSection}
                on:keyup={(e) => {
                  if (e.key === 'Enter') openSearchSection();
                }}>
                <div
                  tabindex="-1"
                  class="metadata-expander-header-title">
                  <strong>{$_('tile.search-results', { count: $matchingParagraphs$.length })}</strong>
                  <div class="expander-icon">
                    <Icon name="chevron-right" />
                  </div>
                </div>
              </div>
            {/if}

            {#if isMediaPlayer && expanded}
              <div class="full-transcript-container">
                <div
                  class="metadata-expander-header"
                  tabindex="0"
                  class:expanded={sidePanelSectionOpen === 'transcripts'}
                  on:click={toggleTranscriptSection}
                  on:keyup={(e) => {
                    if (e.key === 'Enter') toggleTranscriptSection();
                  }}>
                  <div
                    tabindex="-1"
                    class="metadata-expander-header-title">
                    <strong>{$_('tile.full-transcripts')}</strong>
                    <div class="expander-icon">
                      <Icon name="chevron-right" />
                    </div>
                  </div>
                </div>

                {#if sidePanelSectionOpen === 'transcripts'}
                  <div class="metadata-content scrollable-area">
                    <ul class="paragraphs-container">
                      {#each $transcripts as paragraph, index}
                        <ParagraphResult
                          {paragraph}
                          selected={isSame(paragraph, selectedParagraph)}
                          stack
                          on:open={() => onClickParagraph(paragraph, index)} />
                      {/each}
                    </ul>
                  </div>
                {/if}
              </div>
            {/if}

            {#if expanded}
              <div class="metadata-container">
                <div
                  class="metadata-expander-header"
                  tabindex="0"
                  class:expanded={sidePanelSectionOpen === 'summary'}
                  on:click={toggleSummarySection}
                  on:keyup={(e) => {
                    if (e.key === 'Enter') toggleSummarySection();
                  }}>
                  <div
                    tabindex="-1"
                    class="metadata-expander-header-title">
                    <strong>{$_('tile.summary')}</strong>
                    <div class="expander-icon">
                      <Icon name="chevron-right" />
                    </div>
                  </div>
                </div>

                {#if sidePanelSectionOpen === 'summary'}
                  <div class="metadata-content scrollable-area">
                    <div class="metadata-text-container">
                      {$fieldSummary}
                    </div>
                  </div>
                {/if}
              </div>
              {#if $hasSeveralFields}
                <div class="metadata-container">
                  <div class="metadata-expander-header"
                       tabindex="0"
                       class:expanded={sidePanelSectionOpen === 'items'}
                       on:click={toggleItemsSection}
                       on:keyup={(e) => {
                    if (e.key === 'Enter') toggleItemsSection();
                  }}>
                    <div
                      tabindex="-1"
                      class="metadata-expander-header-title">
                      <strong>{$_('tile.items')}</strong>
                      <div class="expander-icon">
                        <Icon name="chevron-right" />
                      </div>
                    </div>
                  </div>
                  {#if sidePanelSectionOpen === 'items'}
                    <div class="metadata-content scrollable-area">
                      <div>
                        <ul class="field-list">
                          {#each $fieldList as item}
                            <li class:current={item.field_id === $fieldFullId.field_id}
                                on:click={() => displayField(item)}>
                              <div class="field-icon">
                                <Icon size="small"
                                      name={item.field_type === 'conversation' ? 'chat' : item.field_type === 'text' ? 'file' : item.field_type} />
                              </div>
                              <div class="field-item">
                                <span
                                  class={item.field_id === $fieldFullId.field_id ? 'title-xxs' : 'body-s'}>{item.field_type}</span>
                                <small class="body-xs">{item.field_id}</small>
                              </div>
                            </li>
                          {/each}
                        </ul>
                      </div>
                    </div>
                  {/if}
                </div>
              {/if}
            {/if}
          {/if}
        </div>
      </div>

      {#if !expanded && $matchingParagraphs$.length > 4}
        <AllResultsToggle
          {showAllResults}
          on:toggle={() => (showAllResults = !showAllResults)} />
      {/if}
    </div>
  {/if}

  {#if showKnowledgeGraph}
    <D3Loader
      rightPanelOpen={sidePanelExpanded}
      on:openRightPanel={toggleSidePanel} />
  {/if}
</div>

<style
  lang="scss"
  src="./BaseTile.scss"></style>
