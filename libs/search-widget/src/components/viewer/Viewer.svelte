<script lang="ts">
  import {
    _, fieldSummary,
    getFieldUrl,
    getTranscripts,
    getWidgetActions,
    isKnowledgeGraphEnabled,
    isPreviewing,
    searchQuery,
    selectedParagraphIndex,
    TypedResult,
    viewerData,
    viewerSearchQuery,
    viewerState,
    ViewerState,
    WidgetAction
  } from '../../core';
  import {
    DocTypeIndicator,
    Dropdown,
    Duration,
    freezeBackground,
    Icon,
    IconButton,
    isMobileViewport,
    ParagraphResult,
    unblockBackground
  } from '../../common';
  import { onDestroy, onMount } from 'svelte';
  import { FIELD_TYPE, Search } from '@nuclia/core';
  import { BehaviorSubject, debounceTime, filter, Observable, of, Subject, take } from 'rxjs';
  import { MetadataContainer, MetadataSectionHeader, SearchResultNavigator } from './';

  // Browser window related variables
  const resizeEvent = new Subject();
  let innerWidth = window.innerWidth;
  $: isMobile = isMobileViewport(innerWidth);

  // Header and menu
  let menuItems: WidgetAction[] = [];
  let menuButton: HTMLElement | undefined;
  let menuPosition: { left: number; top: number } | undefined;
  let displayMenu = false;
  let resultNavigatorDisabled = false;
  let resultNavigatorHidden = false;
  let resultNavigatorWidth = 0;
  let headerActionsWidth = 0;
  const buttonWidth = 40;
  $: hasMenu = menuItems.length > 0;
  $: actionsWidth = headerActionsWidth + (hasMenu ? buttonWidth * 2 : buttonWidth);

  // Renderer
  let isMediaPlayer = false;

  // Side panel
  const isSearchingInResource = new BehaviorSubject(false);
  let sidePanelExpanded = false;
  let showKnowledgeGraph = false;
  let transcriptsInitialized = false;
  let findInputElement: HTMLElement;
  type sidePanelSection = 'search' | 'transcripts' | 'summary' | 'items';
  let sidePanelSectionOpen: sidePanelSection = 'search';
  const findInPlaceholderPrefix = 'tile.find-in-';
  let findInPlaceholder = '';
  let transcripts: Observable<Search.FindParagraph[]> = of([]);

  // Load data from the state
  let state: ViewerState;
  let result: TypedResult | null;
  const stateSubscription = viewerData.subscribe((value) => {
    freezeBackground(true);
    state = value;
    result = value.currentResult;
    resultNavigatorHidden = (result?.paragraphs?.length || 0) <= 1;
    switch (result?.resultType) {
      case 'audio':
      case 'video':
        findInPlaceholder = `${findInPlaceholderPrefix}${result.resultType}`;
        isMediaPlayer = true;
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

  onMount(() => {
    resizeEvent.pipe(debounceTime(100)).subscribe(() => setHeaderActionWidth());
    menuItems = getWidgetActions();
  });

  onDestroy(() => {
    stateSubscription.unsubscribe();
  });

  function close() {
    viewerState.reset();
    unblockBackground(true);
    displayMenu = false;
    resultNavigatorDisabled = false;
    resultNavigatorHidden = false;
    sidePanelExpanded = false;
    showKnowledgeGraph = false;
    isMediaPlayer = false;
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
        filter((url) => !!url)
      )
      .subscribe((url) => window.open(url, 'blank', 'noreferrer'));
  }

  function openMenu(event) {
    event.stopPropagation();
    if (menuButton) {
      displayMenu = true;
      const menuWidth = 176;
      menuPosition = {
        left: menuButton.offsetLeft - menuWidth + menuButton.offsetWidth,
        top: menuButton.clientHeight + 6,
        width: menuWidth
      };
      // close side panel
      sidePanelExpanded = false;
    }
  }

  function clickOnMenu(item: WidgetAction) {
    const fullId = state.fieldFullId;
    if (fullId) {
      item.action(fullId);
    }
  }

  function openPrevious() {
    // TODO: openPrevious
  }

  function openNext() {
    // TODO: openNext
  }

  function toggleSidePanel() {
    sidePanelExpanded = !sidePanelExpanded;
    resultNavigatorDisabled = sidePanelExpanded;
    if (!showKnowledgeGraph) {
      if (sidePanelExpanded) {
        // Wait for animation to finish before focusing on find input, otherwise the focus is breaking the transition
        setTimeout(() => findInputElement?.focus(), Duration.MODERATE);
      } else if (isSearchingInResource.value) {
        selectedParagraphIndex.set(null);
        isSearchingInResource.next(false);
        viewerSearchQuery.set(searchQuery.getValue());
      }
    }
  }

  function toggleKnowledgeGraph() {
    // TODO toggleKnowledgeGraph
  }

  const findInField = () => {
    const query = viewerSearchQuery.getValue();
    sidePanelSectionOpen = 'search';
    if (query) {
      isSearchingInResource.next(true);
      // FIXME
      // searchInResource(query, result, { highlight: true })
      //   .pipe(map((results) => results.paragraphs?.results || []))
      //   .subscribe((paragraphs) => {
      //     resultIndex = -1;
      //     viewerSearchResults.set(paragraphs.map((paragraph) => mapParagraph2WidgetParagraph(paragraph, previewKind)));
      //   });
    } else {
      isSearchingInResource.next(false);
    }
  };

  function toggleSection(section: sidePanelSection) {
    sidePanelSectionOpen = sidePanelSectionOpen === section ? 'search' : section;

    if (sidePanelSectionOpen === 'transcripts' && !transcriptsInitialized) {
      transcriptsInitialized = true;
      setTimeout(() => transcripts = getTranscripts());
    }
  }

  function selectTranscript(paragraph) {
    // TODO: select transcript
  }
</script>

<svelte:window
  bind:innerWidth
  on:resize={(event) => resizeEvent.next(event)}></svelte:window>

{#if $isPreviewing}
  <div class="sw-viewer"
       style:--search-section-count={sidePanelSectionOpen === 'search' ? 1 : 0}
       style:--metadata-block-count={(isMediaPlayer ? 2 : 1) + (sidePanelSectionOpen !== 'search' ? 1 : 0)}>
    <header style:--header-actions-width={`${actionsWidth}px`}>
      <div class="header-title">
        <DocTypeIndicator type={result?.resultType} />
        <h3
          class="ellipsis title-m">
          {result?.title}
        </h3>
        {#if state.fieldFullId.field_type === FIELD_TYPE.file || state.fieldFullId.field_type === FIELD_TYPE.link}
          <IconButton
            icon={state.fieldFullId.field_type === FIELD_TYPE.file ? 'download' : 'square-arrow'}
            ariaLabel={$_('resource.source')}
            aspect="basic"
            on:click={openOrigin} />
        {/if}
      </div>

      <div class="header-actions">
        {#if !isMobile && !resultNavigatorHidden}
          <SearchResultNavigator
            resultIndex={state.selectedParagraphIndex}
            total={result?.paragraphs.length}
            disabled={resultNavigatorDisabled}
            on:offsetWidth={(event) => (resultNavigatorWidth = event.detail.offsetWidth)}
            on:openPrevious={openPrevious}
            on:openNext={openNext} />
        {/if}

        {#if hasMenu && result?.paragraphs.length > 1}
          <div class="separator" />
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
              <ul class="viewer-menu">
                {#each menuItems as item}
                  <li on:click={() => clickOnMenu(item)}>{item.label}</li>
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

    <div class="viewer-body"
         class:side-panel-expanded={sidePanelExpanded}>
      {#if isMobile && !resultNavigatorHidden}
        <SearchResultNavigator
          resultIndex={state.selectedParagraphIndex}
          total={result?.paragraphs.length}
          disabled={resultNavigatorDisabled}
          on:openPrevious={openPrevious}
          on:openNext={openNext} />
      {/if}

      <div class="viewer-content"
           class:no-result-navigator={resultNavigatorHidden}></div>

      <div class="side-panel">
        {#if !isMobile}
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

        <div class="side-panel-content">
            {#if showKnowledgeGraph}
              <!-- TODO knowledge graph -->
            {:else}
              {#if !isMobile}
                <div
                  class="find-bar-container"
                  tabindex="0">
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

                {#if sidePanelSectionOpen !== 'search'}
                  <div class="search-results-collapsed">
                    <MetadataSectionHeader on:toggle={() => toggleSection('search')}>
                      {$_('tile.search-results', { count: result?.paragraphs.length })}
                    </MetadataSectionHeader>
                  </div>
                {:else}
                  <div class="search-results-container" tabindex="-1">
                    <ul class="sw-paragraphs-container">
                      {#each result?.paragraphs as paragraph, index}
                        <ParagraphResult {paragraph}
                                         stack={true}
                                         minimized={isMobile}
                                         resultType={result?.resultType}
                                         noIndicator={result?.resultType === 'image' || result?.resultType === 'text'}
                                         selected={index === state.selectedParagraphIndex}/>
                      {/each}
                    </ul>
                  </div>
                {/if}

              {/if}

              {#if isMediaPlayer}
                <MetadataContainer sectionId="transcripts"
                                   expanded={sidePanelSectionOpen === 'transcripts'}
                                   on:toggle={(event) => toggleSection(event.detail)}>
                  <span slot="sectionTitle">{$_('tile.full-transcripts')}</span>
                  <ul class="sw-paragraphs-container" slot="sectionContent">
                    {#each $transcripts as paragraph}
                      <ParagraphResult
                        {paragraph}
                        selected={paragraph.id === 'TODO'}
                        stack
                        on:open={() => selectTranscript(paragraph)} />
                    {/each}
                  </ul>
                </MetadataContainer>
              {/if}

              <MetadataContainer sectionId="summary"
                                 expanded={sidePanelSectionOpen === 'summary'}
                                 on:toggle={(event) => toggleSection(event.detail)}>
                <span slot="sectionTitle">{$_('tile.summary')}</span>
                <div class="summary-container" slot="sectionContent">{$fieldSummary}</div>
              </MetadataContainer>
            {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style
  lang="scss"
  src="./Viewer.scss"></style>
