<script lang="ts">
  import AllResultsToggle from '../../common/paragraph-result/AllResultsToggle.svelte';
  import ParagraphResult from '../../common/paragraph-result/ParagraphResult.svelte';
  import TileHeader from './header/TileHeader.svelte';
  import Icon from '../../common/icons/Icon.svelte';
  import { ResourceField, Search } from '@nuclia/core';
  import { FieldFullId, PreviewKind, WidgetParagraph } from '../../core/models';
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import {
    BehaviorSubject,
    combineLatest,
    debounceTime,
    filter,
    iif,
    map,
    mergeMap,
    Observable,
    of,
    Subject,
    switchMap,
    take,
  } from 'rxjs';
  import { searchQuery } from '../../core/stores/search.store';
  import { Duration } from '../../common/transition.utils';
  import { viewerSearchQuery, viewerSearchResults } from '../../core/stores/viewer-search.store';
  import { getExternalUrl, goToUrl, mapSmartParagraph2WidgetParagraph } from '../../core/utils';
  import { navigateToLink } from '../../core/stores/widget.store';
  import {
    fieldData,
    fieldFullId,
    fieldSummary,
    isPreviewing,
    resourceField,
    resourceTitle,
    viewerState,
  } from '../../core/stores/viewer.store';
  import { freezeBackground, unblockBackground } from '../../common/modal/modal.utils';
  import { searchInResource } from '../../core/api';
  import SearchResultNavigator from './header/SearchResultNavigator.svelte';
  import { _ } from '../../core/i18n';

  export let result: Search.SmartResult;
  export let previewKind: PreviewKind;
  export let typeIndicator: string;
  export let withSummary = false;
  export let thumbnailLoaded = false;
  export let loading = false;

  const dispatch = createEventDispatcher();

  let innerWidth = window.innerWidth;
  const closeButtonWidth = 48;

  let expanded = false;
  let showAllResults = false;
  let selectedParagraph: WidgetParagraph | undefined;
  let resultIndex: number | undefined;
  let headerActionsWidth = 0;
  let resultNavigatorWidth;
  let resultNavigatorDisabled = false;
  let sidePanelExpanded = false;
  const resizeEvent = new Subject();
  let findInputElement: HTMLElement;
  let findInPlaceholder = 'tile.find-in-';

  const globalQuery = searchQuery;

  $: isMobile = innerWidth < 448;
  $: defaultTransitionDuration = expanded ? Duration.MODERATE : 0;
  $: switch (previewKind) {
    case PreviewKind.AUDIO:
      findInPlaceholder += 'audio';
      break;
    case PreviewKind.VIDEO:
      findInPlaceholder += 'video';
      break;
    default:
      findInPlaceholder += 'document';
      break;
  }

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
    const currentId = fieldFullId.getValue();
    if (
      currentId?.resourceId === result.id &&
      currentId?.field_type === result.field?.field_type &&
      currentId.field_id === result.field?.field_id
    ) {
      openParagraph(undefined, -1);
    }
  });

  onDestroy(() => reset());

  const onClickParagraph = (paragraph, index) => {
    if (result.field) {
      fieldFullId.set({
        field_id: result.field.field_id,
        field_type: result.field.field_type,
        resourceId: result.id,
      });
    }
    resourceTitle.set(result.title || '');
    viewerSearchQuery.set(globalQuery.getValue());

    navigateToLink
      .pipe(
        take(1),
        mergeMap((navigateToLink: boolean) =>
          iif(
            () => navigateToLink,
            resourceField.pipe(
              filter((data) => !!data),
              take(1),
            ),
            of(false),
          ),
        ),
      )
      .subscribe((data) => {
        if (data === false) {
          openParagraph(paragraph, index);
        } else {
          const url = getExternalUrl(result, data as ResourceField);
          if (url) {
            goToUrl(url, paragraph?.text);
          } else {
            openParagraph(paragraph, index);
          }
        }
      });
  };

  const openParagraph = (paragraph, index) => {
    resultIndex = index;
    selectParagraph(paragraph);
    if (!expanded) {
      expanded = true;
      isPreviewing.set(true);
      freezeBackground(true);
    }
    setTimeout(() => setHeaderActionWidth());
  };

  const selectParagraph = (paragraph) => {
    selectedParagraph = paragraph;
    dispatch('selectParagraph', paragraph);
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
    dispatch('close');
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

  const findInField = () => {
    const query = viewerSearchQuery.getValue();

    if (query) {
      isSearchingInResource.next(true);
      searchInResource(query, result, { highlight: true })
        .pipe(map((results) => results.paragraphs?.results || []))
        .subscribe((paragraphs) => {
          resultIndex = -1;
          viewerSearchResults.set(
            paragraphs.map((paragraph) => mapSmartParagraph2WidgetParagraph(paragraph, previewKind)),
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
    } else if (event.key === 'Escape') {
      closePreview();
    }
  };

  function reset() {
    expanded = false;
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
    <div hidden={expanded && !loading}>
      <slot name="thumbnail" />
    </div>

    {#if expanded}
      {#if isMobile}
        <SearchResultNavigator
          {resultIndex}
          total={$matchingParagraphs$.length}
          on:openPrevious={openPrevious}
          on:openNext={openNext} />
      {/if}
      <div
        class="field-viewer-container"
        class:full-height={!withSummary}
        class:loading>
        <slot name="viewer" />
      </div>

      {#if withSummary}
        <div
          class="summary-container"
          hidden={!expanded}>
          {$fieldSummary}
        </div>
      {/if}
    {/if}
  </div>

  {#if thumbnailLoaded}
    <div class="result-details">
      <TileHeader
        {expanded}
        {headerActionsWidth}
        {typeIndicator}
        resourceTitle={result.title}
        on:clickOnTitle={() => onClickParagraph(undefined, -1)}
        on:close={closePreview}>
        {#if !isMobile}
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
        {#if expanded}
          <div
            class="side-panel-button"
            on:click={toggleSidePanel}>
            <Icon name={sidePanelExpanded ? 'chevrons-right' : 'search'} />
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
              aria-label={$_(findInPlaceholder)}
              placeholder={$_(findInPlaceholder)}
              tabindex="-1"
              bind:this={findInputElement}
              bind:value={$viewerSearchQuery}
              on:change={findInField} />
          </div>

          <div
            class="search-result-paragraphs"
            tabindex="-1">
            <ul
              class="paragraphs-container"
              class:expanded={showAllResults}
              class:can-expand={$matchingParagraphs$.length > 4}
              style="--paragraph-count: {$matchingParagraphs$.length}">
              {#each $matchingParagraphs$ as paragraph, index}
                <ParagraphResult
                  {paragraph}
                  ellipsis={!expanded}
                  minimized={isMobile && !expanded}
                  stack={expanded}
                  selected={isSame(paragraph, selectedParagraph)}
                  on:open={(event) => onClickParagraph(event.detail, index)} />
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
  src="./BaseTile.scss"></style>
