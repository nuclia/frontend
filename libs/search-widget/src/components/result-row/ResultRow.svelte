<script lang="ts">
  import {
    AllResultsToggle,
    DocTypeIndicator,
    Icon,
    isMobileViewport,
    ParagraphResult,
    Thumbnail,
    ThumbnailPlayer,
  } from '../../common';
  import {
    displayMetadata,
    getNavigationUrl,
    goToUrl,
    hideThumbnails,
    navigateToFile,
    navigateToLink,
    targetNewTab,
    trackingEngagement,
    TypedResult,
    viewerData,
  } from '../../core';
  import type { ResourceField, Search } from '@nuclia/core';
  import { combineLatest, map, of, switchMap, take } from 'rxjs';
  import { FieldMetadata } from './';

  export let result: TypedResult;

  let thumbnailLoaded = false;
  let showAllResults = false;

  let fallback = '';
  let isPlayable = false;
  let innerWidth = window.innerWidth;
  let expandedParagraphHeight: string | undefined;
  let metaKeyOn = false;
  $: isMobile = isMobileViewport(innerWidth);
  $: paragraphs = result.paragraphs || [];
  $: {
    switch (result.resultType) {
      case 'audio':
        fallback = 'audio';
        isPlayable = true;
        break;
      case 'conversation':
        fallback = 'chat';
        break;
      case 'image':
        fallback = 'image';
        break;
      case 'pdf':
        fallback = result.resultIcon;
        break;
      case 'spreadsheet':
        fallback = 'spreadsheet';
        break;
      case 'text':
        fallback = 'file';
        break;
      case 'video':
        fallback = 'play';
        isPlayable = true;
        break;
    }
  }

  function clickOnResult(paragraph?: Search.FindParagraph, index?: number) {
    trackingEngagement.set({ type: 'RESULT', rid: result.id, paragraph });
    if (result.field) {
      const resourceField: ResourceField = { ...result.field, ...result.fieldData };
      combineLatest([navigateToFile, navigateToLink, targetNewTab])
        .pipe(
          take(1),
          map((features) => features as boolean[]),
          switchMap(([toFile, toLink, newTab]) =>
            toFile || toLink
              ? getNavigationUrl(toFile, toLink, result, resourceField).pipe(
                  map((url) => (url ? { url, newTab } : false)),
                )
              : of(false),
          ),
        )
        .subscribe((data) => {
          if (data) {
            const { url, newTab } = data as { url: string; newTab: boolean };
            goToUrl(url, paragraph?.text, newTab || metaKeyOn);
          } else {
            viewerData.set({
              result,
              selectedParagraphIndex: typeof index === 'number' ? index : -1,
            });
          }
        });
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Meta' || event.key === 'Control') {
      metaKeyOn = true;
    }
  }

  function onKeyUp(event: KeyboardEvent) {
    if (event.key === 'Meta' || event.key === 'Control') {
      metaKeyOn = false;
    }
  }
</script>

<svelte:window
  bind:innerWidth
  on:keydown={onKeyDown}
  on:keyup={onKeyUp} />

<div
  class="sw-result-row"
  data-nuclia-rid={result.id}>
  <div
    class="thumbnail-container"
    hidden={$hideThumbnails}>
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
        on:loaded={() => (thumbnailLoaded = true)} />
    {/if}
    <div class="doc-type-container">
      <DocTypeIndicator type={result.resultType} />
    </div>
  </div>
  <div class="result-container">
    <div class="result-title-container">
      {#if $hideThumbnails}
        <div class="result-icon">
          <Icon name={fallback} />
        </div>
      {/if}
      <div>
        <h3
          class="ellipsis title-m"
          on:click={() => clickOnResult()}
          on:keyup={(e) => {
            if (e.key === 'Enter') clickOnResult();
          }}>
          {result?.title}
        </h3>

        {#if $displayMetadata}
          <FieldMetadata {result} />
        {/if}
      </div>
    </div>

    <div tabindex="-1">
      <ul
        class="sw-paragraphs-container"
        class:expanded={showAllResults}
        class:can-expand={paragraphs.length > 4}
        style:--paragraph-count={paragraphs.length}
        style:--expanded-paragraph-height={!!expandedParagraphHeight ? expandedParagraphHeight : undefined}>
        {#each paragraphs as paragraph, index}
          <ParagraphResult
            {paragraph}
            resultType={result.resultType}
            ellipsis={true}
            minimized={isMobile}
            on:open={() => clickOnResult(paragraph, index)}
            on:paragraphHeight={(event) => (expandedParagraphHeight = event.detail)} />
        {/each}
      </ul>

      {#if paragraphs.length > 4}
        <AllResultsToggle
          {showAllResults}
          on:toggle={() => (showAllResults = !showAllResults)} />
      {/if}
    </div>
  </div>
</div>

<style
  lang="scss"
  src="./ResultRow.scss"></style>
