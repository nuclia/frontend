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
  import { map, Observable } from 'rxjs';
  import { getRegionalBackend, getResource } from '../../core/api';
  import { getFileField } from '../../core/old-stores/viewer.store';

  export let result: IResource = {id: ''} as IResource;

  const dispatch = createEventDispatcher();
  let innerWidth = window.innerWidth;

  let expanded = false;
  let thumbnailLoaded = false;
  let showAllResults = false;
  let selectedParagraph: PdfWidgetParagraph | undefined;
  let resultIndex: number | undefined;
  let resource: Observable<Resource>;
  let pdfUrl: Observable<string>;
  let headerActionsElement: HTMLElement;

  $: isMobile = innerWidth < 448;
  $: defaultTransitionDuration = expanded ? Duration.MODERATE : 0;
  $: isExpandedFullScreen = innerWidth < 820;

  const matchingParagraphs = nucliaState().getMatchingParagraphs(result.id);

  onMount(() => {
    loadPdfJs();
  });

  const openParagraph = (paragraph, index) => {
    resultIndex = index + 1;
    selectedParagraph = paragraph;
    expanded = true;
    open();
  };
  const openPrevious = () => {
    resultIndex -= 1;
  };
  const openNext = () => {
    resultIndex += 1;
  };

  const open = () => {
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
</script>

<svelte:window bind:innerWidth/>
<div class="sw-tile sw-pdf-tile"
     class:expanded>

  <div class="thumbnail-container">
    <div hidden={expanded}>
      <Thumbnail src={result.thumbnail}
                 aspectRatio="5/4"
                 on:loaded={() => thumbnailLoaded = true}/>
    </div>

    {#if expanded}
      <div class="pdf-viewer-container">
        <PdfViewer src={$pdfUrl}
                   paragraph={selectedParagraph}/>
      </div>
    {/if}
  </div>

  {#if thumbnailLoaded}
    <div class="result-details"
         transition:fade={{duration: Duration.SUPERFAST}}>
      <header style:--header-actions-width={`${headerActionsElement?.offsetWidth}px`}>
        <div class:header-title={expanded}>
          <div class="doc-type-container">
            <DocTypeIndicator type="pdf"/>
          </div>
          <h3 class="ellipsis">{result?.title}</h3>
        </div>

        {#if expanded}
          <div class="header-actions"
               bind:this={headerActionsElement}
               in:fade={{duration: Duration.FAST}}>
            <div class="search-result-navigator">
              <span class="result-count">{$_('results.count', {
                index: resultIndex,
                total: $matchingParagraphs.length
              })}</span>

              <IconButton icon="chevron-up"
                          size="small"
                          ariaLabel="{$_('result.previous')}"
                          aspect="basic"
                          on:click={openPrevious}></IconButton>

              <IconButton icon="chevron-down"
                          size="small"
                          ariaLabel="{$_('result.next')}"
                          aspect="basic"
                          on:click={openNext}></IconButton>
            </div>
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
              class:can-expand={$matchingParagraphs.length > 4}
              style="--paragraph-count: {$matchingParagraphs.length}">
            {#each $matchingParagraphs as paragraph, index}
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

        {#if $matchingParagraphs.length > 4}
          <AllResultsToggle {showAllResults}
                            on:toggle={() => (showAllResults = !showAllResults)}/>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style lang="scss" src="./PdfTile.scss"></style>
