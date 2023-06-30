<script lang="ts">
  import { DocTypeIndicator, isMobileViewport, ParagraphResult, Thumbnail, ThumbnailPlayer } from '../../common';
  import { getCDN, trackingEngagement, TypedResult } from '../../core';
  import { Search } from '@nuclia/core';

  export let result: TypedResult;

  let thumbnailLoaded = false;
  let showAllResults = false;

  let fallback = '';
  let typeIndicator = '';
  let isPlayable = false;
  let innerWidth = window.innerWidth;
  $: isMobile = isMobileViewport(innerWidth);
  $: {
    switch (result.resultType) {
      case 'audio':
        fallback = `${getCDN()}tiles/audio.svg`;
        typeIndicator = 'audio'
        isPlayable = true;
        break;
      case 'conversation':
        fallback = `${getCDN()}icons/text/plain.svg`;
        typeIndicator = 'conv';
        break;
      case 'image':
        fallback = `${getCDN()}icons/image/jpg.svg`;
        typeIndicator = 'image';
        break;
      case 'pdf':
        fallback = `${getCDN()}icons/application/pdf.svg`;
        typeIndicator = 'pdf';
        break;
      case 'spreadsheet':
        fallback = `${getCDN()}icons/text/csv.svg`;
        typeIndicator = 'spreadsheet';
        break;
      case 'text':
        fallback = `${getCDN()}icons/text/plain.svg`;
        typeIndicator = 'text';
        break;
      case 'video':
        typeIndicator = 'video';
        isPlayable = true;
        break;
    }
  }

  function clickOnResult(paragraph?: Search.FindParagraph, index?: number) {
    trackingEngagement.set({ type: 'RESULT', rid: result.id, paragraph });
    // TODO open viewer
  }
</script>

<svelte:window bind:innerWidth />

<div class="sw-result-row">
  <div class="thumbnail-container">
    {#if isPlayable}
      <ThumbnailPlayer
        thumbnail={result.thumbnail}
        {fallback}
        hasBackground={!result.thumbnail}
        aspectRatio="5/4"
        on:loaded={() => (thumbnailLoaded = true)}
        on:play={() => clickOnResult()} />
    {:else}
      <Thumbnail
        src={result.thumbnail}
        {fallback}
        aspectRatio="5/4"
        on:loaded={() => (thumbnailLoaded = true)}/>
    {/if}
    <div class="doc-type-container">
      <DocTypeIndicator type={typeIndicator} />
    </div>
  </div>
  <div class="result-container">
    <h3
      class="ellipsis title-m"
      on:click={() => clickOnResult()}>
      {result?.title}
    </h3>

    <div
      class="search-result-paragraphs"
      tabindex="-1">
      <ul
        class="paragraphs-container"
        class:expanded={showAllResults}
        class:can-expand={result.paragraphs.length > 4}>
        {#each result.paragraphs as paragraph, index}
          <ParagraphResult
            {paragraph}
            resultType={result.resultType}
            ellipsis={true}
            minimized={isMobile}
            on:open={() => clickOnResult(paragraph, index)} />
        {/each}
      </ul>
    </div>
  </div>
</div>

<style
  lang="scss"
  src="./ResultRow.scss"></style>
