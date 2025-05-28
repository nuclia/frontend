<script lang="ts">
  import {
    _,
    fieldFullId,
    fieldList,
    fieldMetadata,
    fieldSummary,
    fullMetadataLoaded,
    getFieldDataFromResource,
    getFieldIdWithShortType,
    getFieldUrl,
    getFindParagraphs,
    getResourceMetadata,
    getResultType,
    graphQuery,
    displayFieldList,
    isKnowledgeGraphEnabled,
    isMediaPlayer,
    isPreviewing,
    loadTranscripts,
    metadataBlockCount,
    resetSearchInField,
    searchInFieldQuery,
    searchInFieldResults,
    searchInResource,
    searchQuery,
    selectedParagraphIndex,
    selectNext,
    selectPrevious,
    transcripts,
    viewerData,
    viewerState,
    widgetActions,
    fieldData,
    getFormatInfos,
    slugify,
    downloadFile,
    hideDownload,
  } from '../../core';
  import type { TypedResult, ViewerState, WidgetAction } from '../../core';
  import {
    DocTypeIndicator,
    Dropdown,
    Duration,
    freezeBackground,
    Icon,
    IconButton,
    isMobileViewport,
    Option,
    ParagraphResult,
    unblockBackground,
  } from '../../common';
  import { onDestroy, onMount } from 'svelte';
  import type { FieldFullId, FieldMetadata, SearchOptions, TextField } from '@nuclia/core';
  import { FIELD_TYPE, Search } from '@nuclia/core';
  import { BehaviorSubject, debounceTime, filter, map, Subject, switchMap, take, takeUntil } from 'rxjs';
  import { MetadataContainer, SearchResultNavigator, ViewerContent } from './';
  import { D3Loader, KnowledgeGraphPanel } from '../knowledge-graph';

  // Browser window related variables
  const resizeEvent = new Subject();
  let innerWidth = $state(window.innerWidth);
  let isMobile = $derived(isMobileViewport(innerWidth));

  // Header and menu
  let menuButton: HTMLElement | undefined = $state();
  let menuPosition: { left: number; top: number } | undefined = $state();
  let displayMenu = $state(false);
  let resultNavigatorDisabled = $state(false);
  let resultNavigatorHidden = $state(false);
  let resultNavigatorWidth = $state(0);
  let headerActionsWidth = $state(0);
  const buttonWidth = 40;
  const separatorWidth = 30;
  let hasMenu = $state(false);
  let actionsWidth = $derived(headerActionsWidth + (hasMenu ? buttonWidth * 2 + separatorWidth : buttonWidth));

  // Side panel
  const isSearchingInResource = new BehaviorSubject(false);
  let sidePanelExpanded = $state(false);
  let showKnowledgeGraph = $state(false);
  let transcriptsInitialized = false;
  let findInputElement: HTMLElement = $state();
  type sidePanelSection = 'search' | 'transcripts' | 'summary' | 'items';
  let sidePanelSectionOpen: sidePanelSection = $state('search');
  const findInPlaceholderPrefix = 'viewer.find-in-';
  let findInPlaceholder = $state('');

  // Load data from the state
  let _state: ViewerState = $state();
  let result: TypedResult | null = $state();
  const stateSubscription = viewerData.pipe(filter((data) => data.isPreviewing)).subscribe((value) => {
    freezeBackground(true);
    _state = value;
    result = value.currentResult;
    resultNavigatorHidden = (result?.paragraphs?.length || 0) <= 1;
    switch (result?.resultType) {
      case 'audio':
      case 'video':
        findInPlaceholder = `${findInPlaceholderPrefix}${result.resultType}`;
        break;
      case 'image':
        findInPlaceholder = `${findInPlaceholderPrefix}image`;
        resultNavigatorHidden = true;
        break;
      default:
        findInPlaceholder = `${findInPlaceholderPrefix}document`;
        break;
    }
  });

  const unsubscribeOnClose: Subject<void> = new Subject();
  onMount(() => {
    const resize = resizeEvent.pipe(debounceTime(100)).subscribe(() => setHeaderActionWidth());
    const menu = widgetActions.subscribe((actions) => (hasMenu = actions.length > 0));
    return () => {
      resize.unsubscribe();
      menu.unsubscribe();
    };
  });

  onDestroy(() => {
    stateSubscription.unsubscribe();
    unsubscribeOnClose.complete();
  });

  function close() {
    unsubscribeOnClose.next();
    viewerState.reset();
    unblockBackground(true);
    displayMenu = false;
    resultNavigatorDisabled = false;
    resultNavigatorHidden = false;
    sidePanelExpanded = false;
    showKnowledgeGraph = false;
    transcriptsInitialized = false;
    sidePanelSectionOpen = 'search';
  }

  function setHeaderActionWidth() {
    headerActionsWidth = isMobile ? 0 : resultNavigatorWidth;
  }

  function openOrigin() {
    getFieldUrl()
      .pipe(
        take(1),
        filter((url) => !!url),
      )
      .subscribe((url) => window.open(url, 'blank', 'noreferrer'));
  }

  function downloadTextField() {
    fieldData.pipe(take(1)).subscribe((fieldData) => {
      const { mime, ext } = getFormatInfos((fieldData?.value as TextField)?.format || 'PLAIN');
      const filename = `${slugify(result?.title || result?.id || '')}.${ext}`;
      const content = (fieldData?.value as TextField)?.body || '';
      downloadFile(filename, mime, content);
    });
  }

  function openMenu(event) {
    event.stopPropagation();
    if (menuButton) {
      displayMenu = true;
      const menuWidth = 176;
      menuPosition = {
        left: menuButton.offsetLeft - menuWidth + menuButton.offsetWidth,
        top: menuButton.clientHeight + 6,
        width: menuWidth,
      };
      // close side panel
      sidePanelExpanded = false;
    }
  }

  function clickOnMenu(item: WidgetAction) {
    const fullId = _state.fieldFullId;
    if (fullId) {
      item.action(fullId);
    }
  }

  function openPrevious() {
    selectPrevious.do();
  }

  function openNext() {
    selectNext.do();
  }

  function selectParagraph(index: number) {
    selectedParagraphIndex.set({ index, playFromTranscripts: false });
  }

  function toggleSidePanel() {
    // TODO: smoothly scroll to the selected paragraph
    sidePanelExpanded = !sidePanelExpanded;
    resultNavigatorDisabled = sidePanelExpanded;
    if (!showKnowledgeGraph) {
      if (sidePanelExpanded) {
        // Wait for animation to finish before focusing on find input, otherwise the focus is breaking the transition
        setTimeout(() => findInputElement?.focus(), Duration.MODERATE);
      } else if (isSearchingInResource.value) {
        resetInternalSearch();
        isSearchingInResource.next(false);
        searchInFieldQuery.set(searchQuery.getValue());
      }
    }
  }

  function toggleKnowledgeGraph() {
    showKnowledgeGraph = !showKnowledgeGraph;
    // load all metadata if they weren't loaded already
    fullMetadataLoaded
      .pipe(
        filter((loaded) => !loaded),
        switchMap(() => {
          return fieldFullId.pipe(
            filter((fieldId) => !!fieldId),
            take(1),
            switchMap((fullId) => getResourceMetadata(fullId)),
          );
        }),
        filter((metadata) => !!metadata),
        map((metadata) => metadata as FieldMetadata),
        takeUntil(unsubscribeOnClose),
      )
      .subscribe((metadata) => fieldMetadata.set(metadata));
  }

  function findInField(event) {
    if (event.key === 'Enter') {
      const query = searchInFieldQuery.getValue();
      sidePanelSectionOpen = 'search';
      if (query && result && result.field) {
        isSearchingInResource.next(true);
        const fullId: FieldFullId = {
          resourceId: result.id,
          ...result.field,
        };
        const options: SearchOptions = {
          highlight: true,
          fields: [getFieldIdWithShortType(fullId)],
        };
        searchInResource(query, result, options)
          .pipe(map((results) => getFindParagraphs(results, fullId)))
          .subscribe((paragraphs) => searchInFieldResults.set(paragraphs));
      } else {
        isSearchingInResource.next(false);
      }
    }
  }

  function resetInternalSearch() {
    resetSearchInField.do();
  }

  function toggleSection(section: sidePanelSection) {
    sidePanelSectionOpen = sidePanelSectionOpen === section ? 'search' : section;

    if (sidePanelSectionOpen === 'transcripts' && !transcriptsInitialized) {
      transcriptsInitialized = true;
      setTimeout(() => loadTranscripts());
    }
  }

  function selectTranscript(paragraph: Search.FindParagraph, index: number) {
    selectedParagraphIndex.set({ index, playFromTranscripts: true });
  }

  function findInGraph() {
    // TODO: findInGraph
    const query = graphQuery.getValue();
    console.log(`Todo: find ${query} in graph`);
  }

  function navigateToField(item: FieldFullId) {
    if (!_state?.currentResult) {
      return;
    }
    const field = { field_id: item.field_id, field_type: item.field_type };
    const fieldResult = {
      ..._state.currentResult,
      field,
      fieldData: getFieldDataFromResource(_state.currentResult, field),
    };
    const { resultType, resultIcon } = getResultType(fieldResult);
    const result: TypedResult = {
      ...fieldResult,
      paragraphs: [],
      resultType,
      resultIcon,
    };
    viewerData.set({ result, selectedParagraphIndex: -1 });
  }

  function onEscape(event: KeyboardEvent) {
    if ($isPreviewing && event.key === 'Escape') {
      close();
    }
  }
</script>

<svelte:window
  bind:innerWidth
  onkeydown={onEscape}
  onresize={(event) => resizeEvent.next(event)} />

{#if $isPreviewing}
  <div
    class="sw-viewer"
    style:--search-section-count={sidePanelSectionOpen === 'search' ? 1 : 0}
    style:--metadata-block-count={$metadataBlockCount}>
    <header style:--header-actions-width={`${actionsWidth}px`}>
      <div class="header-title">
        <DocTypeIndicator type={result?.resultType} />
        <h3 class="ellipsis title-m">
          {result?.title}
        </h3>
        {#if _state.fieldFullId?.field_type === FIELD_TYPE.link || !$hideDownload}
          {#if _state.fieldFullId?.field_type === FIELD_TYPE.file || _state.fieldFullId?.field_type === FIELD_TYPE.link}
            <IconButton
              icon={_state.fieldFullId.field_type === FIELD_TYPE.file ? 'download' : 'square-arrow'}
              ariaLabel={$_('resource.source')}
              aspect="basic"
              on:click={openOrigin} />
          {:else if _state.fieldFullId?.field_type === FIELD_TYPE.text}
            <IconButton
              icon="download"
              ariaLabel={$_('resource.source')}
              aspect="basic"
              on:click={downloadTextField} />
          {/if}
        {/if}
      </div>

      <div class="header-actions">
        {#if !isMobile && !resultNavigatorHidden && !resultNavigatorDisabled}
          <SearchResultNavigator
            resultIndex={_state.playFromTranscript ? -1 : _state.selectedParagraphIndex}
            total={result?.paragraphs.length}
            on:offsetWidth={(event) => (resultNavigatorWidth = event.detail.offsetWidth)}
            on:openPrevious={openPrevious}
            on:openNext={openNext} />
        {/if}

        {#if hasMenu && result?.paragraphs.length > 1}
          <div class="separator"></div>
        {/if}
        {#if hasMenu}
          <div bind:this={menuButton}>
            <IconButton
              icon="more-vertical"
              aspect="basic"
              on:click={openMenu} />
          </div>

          {#if displayMenu}
            <Dropdown
              position={menuPosition}
              on:close={() => (displayMenu = false)}>
              <ul>
                {#each $widgetActions as item}
                  <Option on:select={() => clickOnMenu(item)}>{item.label}</Option>
                {/each}
              </ul>
            </Dropdown>
          {/if}
        {/if}
        <IconButton
          icon="cross"
          ariaLabel={$_('generic.close')}
          aspect="basic"
          on:click={close} />
      </div>
    </header>

    <div
      class="viewer-body"
      class:side-panel-expanded={sidePanelExpanded}>
      {#if isMobile && !resultNavigatorHidden}
        <SearchResultNavigator
          resultIndex={_state.selectedParagraphIndex}
          total={result?.paragraphs.length}
          disabled={resultNavigatorDisabled}
          on:openPrevious={openPrevious}
          on:openNext={openNext} />
      {/if}

      <div class="viewer-content">
        {#if !showKnowledgeGraph}
          <ViewerContent noResultNavigator={resultNavigatorHidden} />
        {:else}
          <D3Loader
            rightPanelOpen={sidePanelExpanded}
            on:openRightPanel={toggleSidePanel} />
        {/if}
      </div>

      <div class="side-panel">
        {#if !isMobile}
          <div class="side-panel-button-container">
            {#if !showKnowledgeGraph}
              <div
                class="side-panel-button"
                onclick={toggleSidePanel}>
                <Icon name={sidePanelExpanded ? 'chevrons-right' : 'chevrons-left'} />
              </div>
            {:else}
              <div
                class="side-panel-button"
                onclick={toggleSidePanel}>
                <Icon name={sidePanelExpanded ? 'chevrons-right' : 'info'} />
              </div>
            {/if}

            {#if $isKnowledgeGraphEnabled}
              <div
                class="side-panel-button"
                onclick={toggleKnowledgeGraph}>
                <Icon name={showKnowledgeGraph ? 'cross' : 'submenu'} />
              </div>
            {/if}
          </div>
        {/if}

        <div class="side-panel-content">
          {#if showKnowledgeGraph}
            {#if !isMobile}
              <div
                class="find-bar-container"
                tabindex="0">
                <Icon name="search" />
                <input
                  class="find-input"
                  type="text"
                  autocomplete="off"
                  tabindex="-1"
                  bind:value={$graphQuery}
                  onchange={findInGraph} />
              </div>
            {/if}
            <KnowledgeGraphPanel />
          {:else}
            {#if !isMobile}
              <div
                class="find-bar-container"
                tabindex="0">
                <div class="search-icon">
                  <Icon name="search" />
                </div>
                <input
                  class="find-input"
                  type="text"
                  autocomplete="off"
                  aria-label={$_(findInPlaceholder)}
                  placeholder={$_(findInPlaceholder)}
                  tabindex="-1"
                  bind:this={findInputElement}
                  bind:value={$searchInFieldQuery}
                  onkeyup={(e) => findInField(e)} />
                {#if _state.query?.length > 0}
                  <IconButton
                    icon="cross"
                    aspect="basic"
                    size="small"
                    on:click={resetInternalSearch} />
                {/if}
              </div>

              {#if result?.paragraphs.length > 0 || _state.searchInFieldResults !== null}
                <MetadataContainer
                  sectionId="search"
                  expanded={sidePanelSectionOpen === 'search'}
                  on:toggle={(event) => toggleSection(event.detail)}>
                  {#snippet sectionTitle()}
                    <span>
                      {$_('viewer.search-results', {
                        count:
                          _state.searchInFieldResults !== null
                            ? _state.searchInFieldResults.length
                            : result?.paragraphs.length,
                      })}
                    </span>
                  {/snippet}
                  {#snippet sectionContent()}
                    <ul class="sw-paragraphs-container">
                      {#if _state.searchInFieldResults !== null}
                        {#each _state.searchInFieldResults as paragraph, index}
                          <ParagraphResult
                            {paragraph}
                            stack={true}
                            minimized={isMobile}
                            resultType={result?.resultType}
                            noIndicator={result?.resultType === 'image' || result?.resultType === 'text'}
                            selected={!_state.playFromTranscript && index === _state.selectedParagraphIndex}
                            on:open={() => selectParagraph(index)} />
                        {/each}
                      {:else}
                        {#each result?.paragraphs as paragraph, index}
                          <ParagraphResult
                            {paragraph}
                            stack={true}
                            minimized={isMobile}
                            resultType={result?.resultType}
                            noIndicator={result?.resultType === 'image' || result?.resultType === 'text'}
                            selected={!_state.playFromTranscript && index === _state.selectedParagraphIndex}
                            on:open={() => selectParagraph(index)} />
                        {/each}
                      {/if}
                    </ul>
                  {/snippet}
                </MetadataContainer>
              {/if}
            {/if}

            {#if $isMediaPlayer}
              <MetadataContainer
                sectionId="transcripts"
                expanded={sidePanelSectionOpen === 'transcripts'}
                on:toggle={(event) => toggleSection(event.detail)}>
                {#snippet sectionTitle()}
                  <span>{$_('viewer.full-transcripts')}</span>
                {/snippet}
                {#snippet sectionContent()}
                  <ul class="sw-paragraphs-container">
                    {#each $transcripts as paragraph, index}
                      <ParagraphResult
                        {paragraph}
                        selected={_state.playFromTranscript && index === _state.selectedParagraphIndex}
                        resultType={result?.resultType}
                        stack
                        on:open={() => selectTranscript(paragraph, index)} />
                    {/each}
                  </ul>
                {/snippet}
              </MetadataContainer>
            {/if}

            {#if $fieldSummary}
              <MetadataContainer
                sectionId="summary"
                expanded={sidePanelSectionOpen === 'summary'}
                on:toggle={(event) => toggleSection(event.detail)}>
                {#snippet sectionTitle()}
                  <span>{$_('viewer.summary')}</span>
                {/snippet}
                {#snippet sectionContent()}
                  <div class="summary-container">
                    {$fieldSummary}
                  </div>
                {/snippet}
              </MetadataContainer>
            {/if}

            {#if $displayFieldList && $fieldList}
              <MetadataContainer
                sectionId="items"
                expanded={sidePanelSectionOpen === 'items'}
                on:toggle={(event) => toggleSection(event.detail)}>
                {#snippet sectionTitle()}
                  <span>{$_('viewer.items')}</span>
                {/snippet}
                {#snippet sectionContent()}
                  <ul class="field-list">
                    {#each $fieldList as item}
                      <li
                        class:current={item.field_id === $fieldFullId.field_id}
                        onclick={() => navigateToField(item)}>
                        <div class="field-icon">
                          <Icon
                            size="small"
                            name={item.field_type === 'conversation'
                              ? 'chat'
                              : item.field_type === 'text'
                                ? 'file'
                                : item.field_type} />
                        </div>
                        <div class="field-item">
                          <span class={item.field_id === $fieldFullId.field_id ? 'title-xxs' : 'body-s'}>
                            {item.field_type}
                          </span>
                          <small class="body-xs">{item.field_id}</small>
                        </div>
                      </li>
                    {/each}
                  </ul>
                {/snippet}
              </MetadataContainer>
            {/if}
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style
  lang="scss"
  src="./Viewer.scss"></style>
