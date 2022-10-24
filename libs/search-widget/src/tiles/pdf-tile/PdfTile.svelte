<script lang="ts">
  import { IResource } from '@nuclia/core';
  import { createEventDispatcher } from 'svelte';
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

  export let result: IResource = {id: ''} as IResource;

  const dispatch = createEventDispatcher();
  let innerWidth = window.innerWidth;

  let expanded = false;
  let thumbnailLoaded = false;
  let showAllResults = false;
  let selectedParagraph: PdfWidgetParagraph | undefined;
  let resultIndex: number | undefined;

  $: isMobile = innerWidth < 448;
  $: defaultTransitionDuration = expanded ? Duration.MODERATE : 0;
  $: isExpandedFullScreen = innerWidth < 820;

  const matchingParagraphs = nucliaState().getMatchingParagraphs(result.id);

  const openParagraph = (paragraph, index) => {
    resultIndex = index + 1;
    selectedParagraph = paragraph;
    expanded = true;
  }
  const openPrevious = () => {
    resultIndex -= 1;
  }
  const openNext = () => {
    resultIndex += 1;
  }
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
      <div class="pdf-container">
        TODO: PDF content
      </div>
    {/if}
  </div>

  {#if thumbnailLoaded}
    <div class="result-details"
         transition:fade={{duration: Duration.SUPERFAST}}>
      <header>
        <div class:header-title={expanded}>
          <div class="doc-type-container">
            <DocTypeIndicator type="pdf"/>
          </div>
          <h3 class="ellipsis">{result?.title}</h3>
        </div>

        {#if expanded}
          <div class="header-actions"
               in:fade={{duration: Duration.FAST}}>
            <div class="search-result-navigator">
              <span class="result-count">{$_('results.count', {index: resultIndex, total: $matchingParagraphs.length})}</span>

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
