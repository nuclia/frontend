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
    getThumbnailInfos,
    getNavigationUrl,
    goToUrl,
    hideThumbnails,
    navigateToFile,
    navigateToLink,
    trackingEngagement,
    viewerData,
  } from '../../core';
  import type { TypedResult } from '../../core';
  import type { ResourceField, Search } from '@nuclia/core';
  import { combineLatest, map, of, switchMap, take } from 'rxjs';
  import { FieldMetadata } from './';

  export let result: TypedResult;
  export let selected = 0;
  export let isSource = false;

  let thumbnailLoaded = false;
  let showAllResults = false;

  let thumbnailInfo = { fallback: '', isPlayable: false };
  let innerWidth = window.innerWidth;
  let expandedParagraphHeight: string | undefined;
  let metaKeyOn = false;
  $: isMobile = isMobileViewport(innerWidth);
  $: paragraphs = result.paragraphs || [];
  $: thumbnailInfo = getThumbnailInfos(result);

  const url = combineLatest([navigateToFile, navigateToLink]).pipe(
    take(1),
    switchMap(([toFile, toLink]) => {
      if (result.field) {
        const resourceField: ResourceField = { ...result.field, ...result.fieldData };
        return toFile || toLink ? getNavigationUrl(toFile, toLink, result, resourceField) : of(undefined);
      }
      return of(undefined);
    }),
  );

  function clickOnResult(paragraph?: Search.FindParagraph, index?: number) {
    trackingEngagement.set({ type: 'RESULT', rid: result.id, paragraph });
    if (result.field) {
      url.subscribe((url) => {
        if (url) {
          goToUrl(url, paragraph?.text, metaKeyOn);
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
  class:reversed={isSource}
  data-nuclia-rid={result.id}>
  <div
    class="thumbnail-container"
    hidden={$hideThumbnails}>
    {#if thumbnailInfo.isPlayable}
      <ThumbnailPlayer
        thumbnail={result.thumbnail}
        fallback={thumbnailInfo.fallback}
        hasBackground={!result.thumbnail}
        aspectRatio="5/4"
        on:loaded={() => (thumbnailLoaded = true)}
        on:play={() => clickOnResult()} />
    {:else}
      <Thumbnail
        src={result.thumbnail}
        fallback={thumbnailInfo.fallback}
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
          <Icon name={thumbnailInfo.fallback} />
        </div>
      {/if}
      <div>
        <h3
          class="ellipsis title-m result-title"
          class:no-thumbnail={$hideThumbnails}>
          {#if $url}
            <a
              href={$url}
              on:click|preventDefault={() => clickOnResult()}>
              {result?.title}
            </a>
          {:else}
            <span
              tabindex="0"
              on:click={() => clickOnResult()}
              on:keyup={(e) => {
                if (e.key === 'Enter') clickOnResult();
              }}>
              {result?.title}
            </span>
          {/if}
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
          <div class="paragraph-container">
            {#if isSource && paragraph.rank}
              <div
                class="number body-m"
                class:selected={selected === paragraph.rank}>
                {paragraph.rank}
              </div>
            {/if}
            <ParagraphResult
              {paragraph}
              resultType={result.resultType}
              ellipsis={true}
              minimized={isMobile}
              on:open={() => clickOnResult(paragraph, index)}
              on:paragraphHeight={(event) => (expandedParagraphHeight = event.detail)} />
          </div>
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
