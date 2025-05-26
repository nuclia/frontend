<script lang="ts">
  import { run, preventDefault } from 'svelte/legacy';

  import {
    AllResultsToggle,
    DocTypeIndicator,
    Icon,
    IconButton,
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
    openNewTab,
    getAttachedImageTemplate,
    feedbackOnResults,
    isAnswerEnabled,
    collapseTextBlocks,
    hideAnswer,
    navigateToOriginURL,
  } from '../../core';
  import type { TypedResult } from '../../core';
  import type { ResourceField, Search } from '@nuclia/core';
  import { combineLatest, forkJoin, of, switchMap, take } from 'rxjs';
  import { FieldMetadata } from './';
  import { showAttachedImages } from '../../core/stores/search.store';
  import Image from '../image/Image.svelte';
  import Feedback from '../answer/Feedback.svelte';
  import Expander from '../../common/expander/Expander.svelte';

  interface Props {
    result: TypedResult;
    selected?: number;
    isSource?: boolean;
    answerRank: number | undefined;
  }

  let { result, selected = 0, isSource = false, answerRank }: Props = $props();

  let thumbnailLoaded = $state(false);
  let showAllResults = $state($collapseTextBlocks);

  let thumbnailInfo = $state({ fallback: '', isPlayable: false });
  let innerWidth = $state(window.innerWidth);
  let toggledParagraphHeights: { [id: string]: number } = $state({});
  let nonToggledParagraphCount = $state(4);
  let toggledParagraphTotalHeight = $state(0);
  let metaKeyOn = false;
  let expanded = $state(!$collapseTextBlocks);
  let isMobile = $derived(isMobileViewport(innerWidth));
  let paragraphs = $derived(result.paragraphs || []);
  run(() => {
    thumbnailInfo = getThumbnailInfos(result);
  });
  run(() => {
    if (showAllResults) {
      toggledParagraphTotalHeight = Object.values(toggledParagraphHeights).reduce((acc, height) => acc + height, 0);
      nonToggledParagraphCount = paragraphs.length - Object.keys(toggledParagraphHeights).length;
    } else {
      const visibleParagraphs = paragraphs.slice(0, 4).map((p) => p.id);
      const visibleToggledParagraphs = Object.entries(toggledParagraphHeights).filter(([id]) =>
        visibleParagraphs.includes(id),
      );
      toggledParagraphTotalHeight = Object.values(visibleToggledParagraphs).reduce(
        (acc, [id, height]) => acc + height,
        0,
      );
      nonToggledParagraphCount = visibleParagraphs.length - visibleToggledParagraphs.length;
    }
  });

  const url = combineLatest([navigateToFile, navigateToLink, navigateToOriginURL, openNewTab]).pipe(
    take(1),
    switchMap(([toFile, toLink, toOrigin, newTab]) => {
      if (result.field) {
        const resourceField: ResourceField = { ...result.field, ...result.fieldData };
        return toFile || toLink || toOrigin || newTab
          ? getNavigationUrl(toFile, toLink, toOrigin, newTab, result, resourceField)
          : of(undefined);
      }
      return of(undefined);
    }),
  );

  const IMAGE_PLACEHOLDER = '__IMAGE_PATH__';
  const imageTemplate = getAttachedImageTemplate(IMAGE_PLACEHOLDER);

  function clickOnResult(paragraph?: Search.FindParagraph, index?: number) {
    trackingEngagement.set({ type: 'RESULT', rid: result.id, paragraph });
    if (result.field) {
      forkJoin([url, openNewTab.pipe(take(1))]).subscribe(([url, openNewTab]) => {
        if (url) {
          goToUrl(url, paragraph?.text, metaKeyOn || openNewTab);
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
  onkeydown={onKeyDown}
  onkeyup={onKeyUp} />

<div
  class="sw-result-row"
  data-nuclia-rid={result.id}>
  <div
    class="thumbnail-container"
    hidden={$hideThumbnails || !expanded}>
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
        clickable
        on:loaded={() => (thumbnailLoaded = true)}
        on:click={() => clickOnResult()} />
    {/if}
    <div class="doc-type-container">
      <DocTypeIndicator type={result.resultType} />
    </div>
  </div>
  <div
    class="result-container"
    class:no-citations={$hideAnswer}>
    <div class="result-title-container">
      {#if $collapseTextBlocks}
        <IconButton
          aspect="basic"
          size="small"
          icon={expanded ? 'chevron-down' : 'chevron-right'}
          ariaLabel={expanded ? 'collapse' : 'expand'}
          on:click={() => {
            expanded = !expanded;
          }} />
      {/if}
      <div class="result-icon">
        <Icon name={thumbnailInfo.fallback} />
      </div>
      <h3
        class="ellipsis title-m result-title"
        class:no-thumbnail={$hideThumbnails}>
        {#if $url}
          <a
            href={$url}
            onclick={preventDefault(() => clickOnResult())}>
            {result?.title}
          </a>
        {:else}
          <span
            tabindex="0"
            onclick={() => clickOnResult()}
            onkeyup={(e) => {
              if (e.key === 'Enter') clickOnResult();
            }}>
            {result?.title}
          </span>
        {/if}
      </h3>
    </div>
    {#if $displayMetadata}
      <FieldMetadata {result} />
    {/if}

    <Expander
      {expanded}
      duration={0}>
      <div tabindex="-1">
        <ul
          class="sw-paragraphs-container"
          class:expanded={showAllResults}
          class:can-expand={paragraphs.length > 4}
          style:--non-toggled-paragraph-count={nonToggledParagraphCount}
          style:--toggled-paragraph-height={`${toggledParagraphTotalHeight}px`}>
          {#if isSource && paragraphs.length === 0 && result.ranks}
            <div class="rank-container">
              {#each result.ranks as rank}
                <div
                  class="number body-m"
                  class:selected={selected === rank}>
                  {rank}
                </div>
              {/each}
            </div>
          {/if}
          {#each paragraphs as paragraph, index}
            <div class="paragraph-container">
              <div
                class="paragraph-result-container"
                class:with-image={$showAttachedImages && paragraph.reference}>
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
                  expanded={$collapseTextBlocks}
                  ellipsis={true}
                  minimized={isMobile}
                  on:open={() => clickOnResult(paragraph, index)}
                  on:paragraphHeight={(event) => (toggledParagraphHeights[paragraph.id] = event.detail)} />
                {#if answerRank !== undefined && $isAnswerEnabled && $feedbackOnResults}
                  <div class="feedback-container">
                    <Feedback
                      size="xsmall"
                      rank={answerRank}
                      {paragraph} />
                  </div>
                {/if}
              </div>
              {#if $showAttachedImages && paragraph.reference}
                <Image
                  path={$imageTemplate.replace(
                    IMAGE_PLACEHOLDER,
                    `${result.id}/${result.field?.field_type}/${result.field?.field_id}/download/extracted/generated/${paragraph.reference}`,
                  )} />
              {/if}
            </div>
          {/each}
        </ul>

        {#if paragraphs.length > 4 && !$collapseTextBlocks}
          <AllResultsToggle
            {showAllResults}
            on:toggle={() => (showAllResults = !showAllResults)} />
        {/if}
      </div>
    </Expander>
  </div>
</div>

<style
  lang="scss"
  src="./ResultRow.scss"></style>
